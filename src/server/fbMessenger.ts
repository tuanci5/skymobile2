import express from 'express';
import { pool } from './db';

const router = express.Router();

// Default avatar SVG (used as fallback when FB avatar is unavailable)
const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="50" fill="#6366f1"/>
  <circle cx="50" cy="38" r="16" fill="white" opacity="0.9"/>
  <ellipse cx="50" cy="80" rx="26" ry="18" fill="white" opacity="0.9"/>
</svg>`;

const FB_GRAPH_VERSION = 'v25.0';

type AdSourceInfo = {
  ad_id: string;
  ad_name?: string | null;
  adset_id?: string | null;
  adset_name?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  creative_id?: string | null;
  ad_image?: string | null;
  ad_message?: string | null;
  ad_permalink_url?: string | null;
  source?: string | null;
  ref?: string | null;
  referer_uri?: string | null;
  status: 'ad_detected' | 'resolved' | 'permission_error' | 'fetch_error';
  error_message?: string | null;
  referral_raw?: any;
};

const normalizeAdAccountId = (value?: string | null) => {
  const cleaned = String(value || '').trim();
  if (!cleaned) return null;
  return cleaned.startsWith('act_') ? cleaned : `act_${cleaned}`;
};

const normalizeRoleText = (role?: string | null) =>
  String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const canViewAllMessengerReports = (role?: string | null) => {
  const normalizedRole = normalizeRoleText(role);
  return normalizedRole === 'quan tri'
    || normalizedRole === 'admin'
    || normalizedRole === 'head'
    || normalizedRole.includes('truong phong')
    || normalizedRole.includes('truong nhom');
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getReportDateFilter = (range?: string | null, column = 'm.created_at', startDate?: unknown, endDate?: unknown) => {
  const normalized = String(range || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()
    .toLowerCase();
  const customStartDate = String(startDate || '').trim();
  const customEndDate = String(endDate || '').trim();

  if (normalized.includes('khoang ngay') || normalized === 'custom') {
    if (!ISO_DATE_PATTERN.test(customStartDate) || !ISO_DATE_PATTERN.test(customEndDate)) {
      throw new Error('Khoảng ngày không hợp lệ.');
    }
    return `${column} >= '${customStartDate}'::date AND ${column} < '${customEndDate}'::date + INTERVAL '1 day'`;
  }

  if (normalized.includes('hom qua') || normalized === 'yesterday') {
    return `${column} >= CURRENT_DATE - INTERVAL '1 day' AND ${column} < CURRENT_DATE`;
  }
  if (normalized.includes('hom nay') || normalized === 'today') {
    return `${column} >= CURRENT_DATE`;
  }
  if (normalized.includes('tuan nay') || normalized === 'week') {
    return `${column} >= date_trunc('week', CURRENT_DATE)`;
  }
  if (normalized.includes('nam nay') || normalized === 'year') {
    return `${column} >= date_trunc('year', CURRENT_DATE)`;
  }
  return `${column} >= date_trunc('month', CURRENT_DATE)`;
};

const isTruthyQueryValue = (value: unknown) =>
  ['1', 'true', 'yes'].includes(String(value || '').trim().toLowerCase());

const graphGet = async (path: string, accessToken: string, params: Record<string, string> = {}) => {
  const url = new URL(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${path.replace(/^\//, '')}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('access_token', accessToken);
  const response = await fetch(url.toString());
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const err: any = new Error(data.error?.message || `Facebook Graph API error ${response.status}`);
    err.graphError = data.error || { status: response.status };
    throw err;
  }
  return data;
};
const SUPPORTED_FB_ATTACHMENT_TYPES = ['image', 'sticker', 'like', 'fallback'] as const;

const normalizeFacebookAttachmentType = (attachment: any): string => {
  const rawType = String(attachment?.type || '').toLowerCase();
  const payload = attachment?.payload || {};
  const url = String(payload?.url || '').toLowerCase();
  const title = String(payload?.title || payload?.name || '').toLowerCase();

  // Facebook can send built-in Messenger Like as type=like, or as an image/sticker-like
  // attachment depending on Graph/Webhook version. Keep a safe heuristic for old/new data.
  if (
    rawType === 'like'
    || /(^|[^a-z])(like|thumb|thumbs|thumbsup|thumbs_up)([^a-z]|$)/i.test(`${url} ${title}`)
  ) {
    return 'like';
  }

  if (
    rawType === 'sticker'
    || payload?.sticker_id
    || /(^|[^a-z])sticker([^a-z]|$)/i.test(`${url} ${title}`)
  ) {
    return 'sticker';
  }

  if (rawType === 'image') return 'image';

  // Some Messenger attachments arrive as fallback payloads but still contain a URL/id.
  if (rawType === 'fallback') return 'fallback';

  return rawType;
};

const getFirstSupportedAttachment = (message: any) => {
  const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
  return attachments.find((attachment: any) => {
    const normalizedType = normalizeFacebookAttachmentType(attachment);
    return SUPPORTED_FB_ATTACHMENT_TYPES.includes(normalizedType as any)
      && (
        attachment?.payload?.url
        || attachment?.payload?.sticker_id
        || attachment?.payload?.attachment_id
        || attachment?.payload?.id
      );
  }) || null;
};

const buildAttachmentProxyUrl = (messageId: number, attachmentType?: string | null) => (
  SUPPORTED_FB_ATTACHMENT_TYPES.includes(String(attachmentType || '').toLowerCase() as any) ? `/api/fb/message-attachment-proxy/${messageId}` : null
);

const mapMessageRow = (row: any) => ({
  ...row,
  attachment_proxy_url: buildAttachmentProxyUrl(row.id, row.attachment_type)
});

const sendFacebookImage = async (accessToken: string, customerId: string, imageUrl: string) => {
  const response = await fetch(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me/messages?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_type: 'RESPONSE',
      recipient: { id: customerId },
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: true
          }
        },
        metadata: 'SENT_BY_HUMAN'
      }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const err: any = new Error(data.error?.message || 'Facebook did not accept the image');
    err.details = data.error || data;
    throw err;
  }
  return data;
};


const extractReferral = (event: any) => {
  return event?.message?.referral || event?.referral || event?.postback?.referral || null;
};

const resolveAdSourceFromWebhook = async (event: any, pageAccessToken: string): Promise<AdSourceInfo | null> => {
  const referral = extractReferral(event);
  const adId = referral?.ad_id || null;
  if (!adId) return null;

  const base: AdSourceInfo = {
    ad_id: String(adId),
    source: referral?.source || null,
    ref: referral?.ref || null,
    referer_uri: referral?.referer_uri || null,
    status: 'ad_detected',
    referral_raw: referral
  };

  try {
    console.log(`[AD_TRACK] Fetching details for ad_id: ${adId}`);
    const adData = await graphGet(String(adId), pageAccessToken, {
      fields: 'id,name,adset{id,name,campaign{id,name}},campaign{id,name},creative{id,effective_object_id,thumbnail_url,object_story_id}'
    });

    const creative = adData.creative || {};
    const adSource: AdSourceInfo = {
      ...base,
      ad_name: adData.name || null,
      adset_id: adData.adset?.id || null,
      adset_name: adData.adset?.name || null,
      campaign_id: adData.campaign?.id || adData.adset?.campaign?.id || null,
      campaign_name: adData.campaign?.name || adData.adset?.campaign?.name || null,
      creative_id: creative.id || null,
      ad_image: creative.thumbnail_url || null,
      status: 'resolved'
    };

    const postId = creative.effective_object_id || creative.object_story_id;
    if (postId) {
      try {
        const postData = await graphGet(String(postId), pageAccessToken, { fields: 'full_picture,message,permalink_url' });
        adSource.ad_image = postData.full_picture ? `/api/fb/avatar-proxy?url=${encodeURIComponent(postData.full_picture)}` : adSource.ad_image;
        adSource.ad_message = postData.message || null;
        adSource.ad_permalink_url = postData.permalink_url || null;
      } catch (postErr: any) {
        console.warn('[AD_TRACK] Could not fetch creative post details:', postErr?.message || postErr);
      }
    }

    console.log(`[AD_TRACK] Resolved ad_id=${adId}, campaign=${adSource.campaign_name || 'unknown'}`);
    return adSource;
  } catch (err: any) {
    const graphError = err?.graphError;
    const code = graphError?.code;
    const message = graphError?.message || err?.message || 'Unknown Graph API error';
    const permissionLike = code === 10 || code === 190 || /permission|permissions|access|token/i.test(message);
    console.error('[AD_TRACK] Error fetching ad details:', message);
    return {
      ...base,
      status: permissionLike ? 'permission_error' : 'fetch_error',
      error_message: message
    };
  }
};

const upsertConversationAdSource = async (conversationId: number, pageId: string, customerId: string, ad: AdSourceInfo | null) => {
  if (!ad?.ad_id) return;
  await pool.query(
    `INSERT INTO fb_conversation_ad_sources (
      conversation_id, page_id, customer_id, ad_id, ad_name, adset_id, adset_name,
      campaign_id, campaign_name, creative_id, ad_image, ad_message, ad_permalink_url,
      source, ref, referer_uri, status, error_message, referral_raw
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    ON CONFLICT (conversation_id, ad_id) DO UPDATE SET
      ad_name = COALESCE(EXCLUDED.ad_name, fb_conversation_ad_sources.ad_name),
      adset_id = COALESCE(EXCLUDED.adset_id, fb_conversation_ad_sources.adset_id),
      adset_name = COALESCE(EXCLUDED.adset_name, fb_conversation_ad_sources.adset_name),
      campaign_id = COALESCE(EXCLUDED.campaign_id, fb_conversation_ad_sources.campaign_id),
      campaign_name = COALESCE(EXCLUDED.campaign_name, fb_conversation_ad_sources.campaign_name),
      creative_id = COALESCE(EXCLUDED.creative_id, fb_conversation_ad_sources.creative_id),
      ad_image = COALESCE(EXCLUDED.ad_image, fb_conversation_ad_sources.ad_image),
      ad_message = COALESCE(EXCLUDED.ad_message, fb_conversation_ad_sources.ad_message),
      ad_permalink_url = COALESCE(EXCLUDED.ad_permalink_url, fb_conversation_ad_sources.ad_permalink_url),
      source = COALESCE(EXCLUDED.source, fb_conversation_ad_sources.source),
      ref = COALESCE(EXCLUDED.ref, fb_conversation_ad_sources.ref),
      referer_uri = COALESCE(EXCLUDED.referer_uri, fb_conversation_ad_sources.referer_uri),
      status = EXCLUDED.status,
      error_message = EXCLUDED.error_message,
      referral_raw = COALESCE(EXCLUDED.referral_raw, fb_conversation_ad_sources.referral_raw),
      last_seen_at = CURRENT_TIMESTAMP,
      click_count = fb_conversation_ad_sources.click_count + 1`,
    [
      conversationId, pageId, customerId, ad.ad_id, ad.ad_name || null, ad.adset_id || null,
      ad.adset_name || null, ad.campaign_id || null, ad.campaign_name || null,
      ad.creative_id || null, ad.ad_image || null, ad.ad_message || null,
      ad.ad_permalink_url || null, ad.source || null, ad.ref || null, ad.referer_uri || null,
      ad.status, ad.error_message || null, ad.referral_raw ? JSON.stringify(ad.referral_raw) : null
    ]
  );
};

// Avatar Proxy to bypass Facebook hotlinking restrictions
router.get('/avatar-proxy', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(DEFAULT_AVATAR_SVG);
    }

    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.warn(`Avatar fetch failed: ${response.status} for ${url.substring(0, 80)}...`);
      // Trả về default avatar thay vì lỗi, tránh broken image trên UI
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(DEFAULT_AVATAR_SVG);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Avatar proxy error:', err);
    // Trả về default avatar thay vì 500
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(DEFAULT_AVATAR_SVG);
  }
});

const extractNumericIdFromBusinessLink = (link?: string | null): string | null => {
  if (!link) return null;
  try {
    const parsed = new URL(link);
    const selectedItemId = parsed.searchParams.get('selected_item_id');
    if (selectedItemId && /^\d+$/.test(selectedItemId)) return selectedItemId;
  } catch (e) {
    const selectedMatch = link.match(/[?&]selected_item_id=(\d+)/);
    if (selectedMatch) return selectedMatch[1];
  }
  return null;
};

const pickFacebookUidCandidate = (items: any[], pageId: string, psid: string): string | null => {
  for (const item of items) {
    const candidate = item?.id ? String(item.id) : '';
    if (/^\d+$/.test(candidate) && candidate !== pageId && candidate !== psid) {
      return candidate;
    }
  }
  return null;
};

async function resolveFacebookUidFromConversationGraph(pageId: string, psid: string, accessToken: string) {
  const baseResult = {
    resolved: false,
    facebook_uid: null as string | null,
    source: 'graph_conversations_participants',
    reason: 'Meta did not expose a global UID for this PSID',
    conversation_id: null as string | null,
    conversation_link: null as string | null,
    participants: [] as any[],
    senders: [] as any[]
  };

  const convSearchRes = await fetch(
    `https://graph.facebook.com/v25.0/${pageId}/conversations?user_id=${encodeURIComponent(psid)}&fields=id,link,participants,senders&access_token=${encodeURIComponent(accessToken)}`
  );
  const convSearchData = await convSearchRes.json();
  if (!convSearchRes.ok || convSearchData?.error) {
    return {
      ...baseResult,
      reason: convSearchData?.error?.message || 'Could not query page conversations'
    };
  }

  const conversation = convSearchData.data?.[0];
  if (!conversation) {
    return { ...baseResult, reason: 'No Graph conversation found for this PSID' };
  }

  baseResult.conversation_id = conversation.id || null;
  baseResult.conversation_link = conversation.link || null;
  baseResult.participants = conversation.participants?.data || [];
  baseResult.senders = conversation.senders?.data || [];

  const uidFromLink = extractNumericIdFromBusinessLink(conversation.link);
  if (uidFromLink && uidFromLink !== pageId && uidFromLink !== psid) {
    return {
      ...baseResult,
      resolved: true,
      facebook_uid: uidFromLink,
      source: 'graph_conversations_link_selected_item_id',
      reason: 'Resolved from conversation link selected_item_id'
    };
  }

  const shallowCandidate = pickFacebookUidCandidate(
    [...baseResult.participants, ...baseResult.senders],
    pageId,
    psid
  );
  if (shallowCandidate) {
    return {
      ...baseResult,
      resolved: true,
      facebook_uid: shallowCandidate,
      reason: 'Resolved from conversation participants/senders'
    };
  }

  if (conversation.id) {
    const detailRes = await fetch(
      `https://graph.facebook.com/v25.0/${conversation.id}?fields=id,link,participants.fields(id,name,picture),senders.fields(id,name)&access_token=${encodeURIComponent(accessToken)}`
    );
    const detailData = await detailRes.json();
    if (detailRes.ok && !detailData?.error) {
      const detailLink = detailData.link || baseResult.conversation_link;
      const detailParticipants = detailData.participants?.data || [];
      const detailSenders = detailData.senders?.data || [];

      const detailUidFromLink = extractNumericIdFromBusinessLink(detailLink);
      if (detailUidFromLink && detailUidFromLink !== pageId && detailUidFromLink !== psid) {
        return {
          ...baseResult,
          resolved: true,
          facebook_uid: detailUidFromLink,
          source: 'graph_conversation_detail_link_selected_item_id',
          reason: 'Resolved from conversation detail link selected_item_id',
          conversation_link: detailLink,
          participants: detailParticipants,
          senders: detailSenders
        };
      }

      const detailCandidate = pickFacebookUidCandidate(
        [...detailParticipants, ...detailSenders],
        pageId,
        psid
      );
      if (detailCandidate) {
        return {
          ...baseResult,
          resolved: true,
          facebook_uid: detailCandidate,
          reason: 'Resolved from conversation detail participants/senders',
          conversation_link: detailLink,
          participants: detailParticipants,
          senders: detailSenders
        };
      }
    }
  }

  const allIds = [...baseResult.participants, ...baseResult.senders].map(item => String(item?.id || '')).filter(Boolean);
  return {
    ...baseResult,
    reason: allIds.includes(psid) ? 'Graph API returned PSID only, not global UID' : baseResult.reason
  };
}

// ─── FB PAGES ───

router.get('/pages', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, page_id, page_name, is_active, dify_api_key, facebook_ad_account_id, business_id, distribution_mode, assigned_users, assigned_ads_users, ai_reply_delay, ai_start_hour, ai_end_hour FROM fb_pages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pages', async (req, res) => {
  try {
    const { page_id, page_name, access_token, dify_api_key, facebook_ad_account_id, business_id } = req.body;
    await pool.query(
      `INSERT INTO fb_pages (page_id, page_name, access_token, dify_api_key, facebook_ad_account_id, business_id) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (page_id) DO UPDATE SET 
       page_name = EXCLUDED.page_name, access_token = EXCLUDED.access_token, dify_api_key = EXCLUDED.dify_api_key,
       facebook_ad_account_id = EXCLUDED.facebook_ad_account_id,
       business_id = EXCLUDED.business_id`,
      [page_id, page_name, access_token, dify_api_key, facebook_ad_account_id || null, business_id || null]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/pages/:page_id', async (req, res) => {
  try {
    const { page_id } = req.params;
    const updates = req.body;
    
    if (Object.keys(updates).length === 0) {
      return res.json({ success: true, message: 'No fields to update' });
    }

    const fieldMap: Record<string, string> = {
      access_token: 'access_token',
      dify_api_key: 'dify_api_key',
      facebook_ad_account_id: 'facebook_ad_account_id',
      business_id: 'business_id',
      ai_reply_delay: 'ai_reply_delay',
      ai_start_hour: 'ai_start_hour',
      ai_end_hour: 'ai_end_hour',
      distribution_mode: 'distribution_mode',
      assigned_users: 'assigned_users',
      assigned_ads_users: 'assigned_ads_users'
    };

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        if (key === 'assigned_users' || key === 'assigned_ads_users') {
          setClauses.push(`${dbField} = $${paramIndex}::jsonb`);
          params.push(JSON.stringify(updates[key] || []));
        } else if (key === 'access_token') {
           if (updates[key].trim() !== '') {
             setClauses.push(`${dbField} = $${paramIndex}`);
             params.push(updates[key]);
           } else {
             continue; // Skip empty token
           }
        } else {
          setClauses.push(`${dbField} = $${paramIndex}`);
          params.push(updates[key] === '' ? null : updates[key]);
        }
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.json({ success: true, message: 'No valid fields to update' });
    }

    params.push(page_id);
    const query = `UPDATE fb_pages SET ${setClauses.join(', ')} WHERE page_id = $${paramIndex} RETURNING id, page_id, page_name, is_active, dify_api_key, facebook_ad_account_id, business_id, distribution_mode, assigned_users, assigned_ads_users, ai_reply_delay, ai_start_hour, ai_end_hour`;
    
    console.log(`📡 Updating Page ${page_id}:`, updates);
    
    const result = await pool.query(query, params);
    
    if (result.rowCount === 0) {
      console.warn(`⚠️ No page found with ID ${page_id} to update.`);
      return res.status(404).json({ error: 'Page not found' });
    }

    console.log(`✅ Page ${page_id} updated successfully.`);
    res.json({ success: true, page: result.rows[0], message: 'Settings updated successfully' });
  } catch (err: any) {
    console.error('❌ Error updating page:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/pages/:page_id/test-token', async (req, res) => {
  const errors: any[] = [];
  const permissions = [
    { name: 'pages_show_list', required: true, granted: null as boolean | null },
    { name: 'pages_messaging', required: true, granted: null as boolean | null },
    { name: 'pages_manage_metadata', required: true, granted: null as boolean | null },
    { name: 'pages_read_engagement', required: true, granted: null as boolean | null },
    { name: 'ads_read', required: true, granted: null as boolean | null }
  ];

  try {
    const { page_id } = req.params;
    const { access_token: bodyToken, facebook_ad_account_id: bodyAdAccountId } = req.body || {};
    const { rows } = await pool.query('SELECT access_token, page_name, facebook_ad_account_id FROM fb_pages WHERE page_id = $1', [page_id]);
    const storedPage = rows[0];
    const token = bodyToken || storedPage?.access_token;
    const adAccountId = normalizeAdAccountId(bodyAdAccountId || storedPage?.facebook_ad_account_id);

    if (!token) return res.status(400).json({ error: 'Missing Page Access Token' });

    let token_alive = false;
    let page_access_ok = false;
    let ads_read_ok = false;
    let page_name = storedPage?.page_name || null;

    try {
      const pageInfo = await graphGet(page_id, token, { fields: 'id,name' });
      token_alive = true;
      page_access_ok = pageInfo?.id === page_id;
      page_name = pageInfo?.name || page_name;
    } catch (err: any) {
      errors.push({ step: 'page_token', message: err?.message, code: err?.graphError?.code, subcode: err?.graphError?.error_subcode });
    }

    try {
      const permData = await graphGet('me/permissions', token);
      const granted = new Set((permData.data || []).filter((p: any) => p.status === 'granted').map((p: any) => p.permission));
      permissions.forEach(p => { p.granted = granted.has(p.name); });
    } catch (err: any) {
      // Page Access Tokens often cannot read /me/permissions. Keep this as
      // diagnostic info only; the direct Page and Ads Account API checks below
      // are the authoritative pass/fail tests for this screen.
      errors.push({
        step: 'permissions_info',
        severity: 'info',
        message: 'Không đọc được /me/permissions bằng Page token; dùng Page/Ads API check để xác thực quyền.',
        detail: err?.message,
        code: err?.graphError?.code,
        subcode: err?.graphError?.error_subcode
      });
    }

    if (adAccountId) {
      try {
        await graphGet(`${adAccountId}/campaigns`, token, { fields: 'id,name', limit: '1' });
        ads_read_ok = true;
        const adsPerm = permissions.find(p => p.name === 'ads_read');
        if (adsPerm) adsPerm.granted = true;
      } catch (err: any) {
        errors.push({ step: 'ads_account', message: err?.message, code: err?.graphError?.code, subcode: err?.graphError?.error_subcode });
      }
    } else {
      errors.push({ step: 'ads_account', message: 'Chưa cấu hình Facebook Ad Account ID' });
    }

    res.json({
      token_alive,
      page_access_ok,
      ads_read_ok,
      page_name,
      ad_account_id: adAccountId,
      permissions,
      errors,
      checked_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/pages/:id/assign-users', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_users } = req.body;
    
    const result = await pool.query(
      `UPDATE fb_pages SET assigned_users = $1::jsonb WHERE page_id = $2 RETURNING id, page_id, page_name, is_active, dify_api_key, facebook_ad_account_id, business_id, distribution_mode, assigned_users, assigned_ads_users, ai_reply_delay, ai_start_hour, ai_end_hour`,
      [JSON.stringify(assigned_users || []), id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ success: true, page: result.rows[0] });
  } catch (err: any) {
    console.error('Error assigning users to page:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/pages/:id/assign-ads-users', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_ads_users } = req.body;

    const result = await pool.query(
      `UPDATE fb_pages SET assigned_ads_users = $1::jsonb WHERE page_id = $2 RETURNING id, page_id, page_name, is_active, dify_api_key, facebook_ad_account_id, business_id, distribution_mode, assigned_users, assigned_ads_users, ai_reply_delay, ai_start_hour, ai_end_hour`,
      [JSON.stringify(assigned_ads_users || []), id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ success: true, page: result.rows[0] });
  } catch (err: any) {
    console.error('Error assigning ads users to page:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/pages/:page_id', async (req, res) => {
  try {
    const { page_id } = req.params;
    await pool.query('DELETE FROM fb_pages WHERE page_id = $1', [page_id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pages/delete/:page_id', async (req, res) => {
  try {
    const { page_id } = req.params;
    await pool.query('DELETE FROM fb_pages WHERE page_id = $1', [page_id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FB WEBHOOK ───

// Verify Webhook
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'sky_mobile_token';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('FB Webhook Verified!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

const processedMessageIds = new Set<string>();
const difyBatchQueues = new Map<string, { messages: string[], timer: NodeJS.Timeout }>();

// Receive Messages
router.post('/webhook', (req, res) => {
  console.log('--- WEBHOOK RECEIVED ---');
  console.log('[RAW_BODY]', JSON.stringify(req.body));
  const body = req.body;

  if (body.object === 'page') {
    // 1. TRẢ VỀ 200 OK NGAY LẬP TỨC ĐỂ FACEBOOK KHÔNG GỬI LẠI (TRÁNH DUPLICATE)
    res.status(200).send('EVENT_RECEIVED');

    // 2. XỬ LÝ BACKGROUND
    (async () => {
      try {
        for (const entry of body.entry) {
          const page_id = entry.id;
          const webhook_event = entry.messaging[0];
          console.log(`[WEBHOOK] Entry ID: ${page_id}, Event Type: ${webhook_event.message ? 'message' : 'other'}`);

          // 3. KIỂM TRA TRÙNG LẶP (DEDUPLICATION)
          if (webhook_event.message && webhook_event.message.mid) {
            const mid = webhook_event.message.mid;
            if (processedMessageIds.has(mid)) {
              console.log(`[DEDUPE] Skipping duplicate MID: ${mid}`);
              continue;
            }
            processedMessageIds.add(mid);
            setTimeout(() => processedMessageIds.delete(mid), 5 * 60 * 1000);
          }

          const sender_psid = webhook_event.sender.id;

          // Look up page to get Dify key and access token
          const { rows: pages } = await pool.query('SELECT * FROM fb_pages WHERE page_id = $1', [page_id]);
          if (pages.length === 0) {
            console.log(`[WEBHOOK] Page ${page_id} not found in database.`);
            continue;
          }
          const page = pages[0];

          if (webhook_event.message) {
            // Skip echo messages (messages sent by the page/app)
            if (webhook_event.message.is_echo) {
              const customer_psid = webhook_event.recipient.id;
              const messageText = webhook_event.message.text;
              if (!messageText) {
                console.log(`[ECHO] No text in echo message from customer ${customer_psid}`);
                continue;
              }

              // Check if sent by AI (using metadata we set when sending)
              const isFromAI = webhook_event.message.metadata === 'SENT_BY_AI';

              console.log(`[ECHO] Processing echo. text: "${messageText}", isFromAI: ${isFromAI}, customer: ${customer_psid}`);

              const { rows: convs } = await pool.query('SELECT id FROM fb_conversations WHERE page_id = $1 AND customer_id = $2', [page_id, customer_psid]);
              if (convs.length > 0) {
                const convId = convs[0].id;

                // Deduplicate: check if this message was recently saved (to avoid duplicate with AI send logic)
                const { rows: existing } = await pool.query(
                  'SELECT id FROM fb_messages WHERE conversation_id = $1 AND message_text = $2 AND created_at > NOW() - INTERVAL \'10 seconds\' LIMIT 1',
                  [convId, messageText]
                );

                if (existing.length === 0) {
                  await pool.query(
                    'INSERT INTO fb_messages (conversation_id, sender_type, message_text) VALUES ($1, $2, $3)',
                    [convId, isFromAI ? 'ai' : 'human', messageText]
                  );

                  await pool.query(
                    'UPDATE fb_conversations SET last_message = $1, last_message_at = CURRENT_TIMESTAMP, is_human_intervened = $2, unread_count = 0 WHERE id = $3',
                    [messageText, !isFromAI, convId]
                  );
                  console.log(`[ECHO] Synced ${isFromAI ? 'AI' : 'human'} reply for conversation ${convId}`);
                }
              }
              continue;
            }

            const supportedAttachment = getFirstSupportedAttachment(webhook_event.message);
            const attachmentType = supportedAttachment ? normalizeFacebookAttachmentType(supportedAttachment) : null;
            const attachmentLabel = attachmentType === 'sticker'
              ? '[Sticker]'
              : attachmentType === 'like'
                ? '[Like]'
                : attachmentType === 'image'
                  ? '[Ảnh]'
                  : '';
            const messageText = webhook_event.message.text || attachmentLabel;
            if (!messageText && !supportedAttachment) continue;
            const attachmentUrl = supportedAttachment?.payload?.url || null;
            const facebookAttachmentId = supportedAttachment?.payload?.attachment_id || supportedAttachment?.payload?.sticker_id || supportedAttachment?.payload?.id || null;

            const adSource = await resolveAdSourceFromWebhook(webhook_event, page.access_token);

          // --- AUTO ASSIGNMENT LOGIC ---
          let assigned_to = null;
          if (page.distribution_mode === 'round_robin') {
            const { rows: existingConvs } = await pool.query('SELECT assigned_to FROM fb_conversations WHERE page_id = $1 AND customer_id = $2', [page_id, sender_psid]);
            if (existingConvs.length > 0 && existingConvs[0].assigned_to) {
              assigned_to = existingConvs[0].assigned_to;
            } else {
              const { rows: cskhUsers } = await pool.query(`
              SELECT u.email, COUNT(c.id) as conv_count
              FROM users u
              LEFT JOIN fb_conversations c ON c.assigned_to = u.email
              WHERE u.role ILIKE '%CSKH%' OR u.role ILIKE '%cskh%'
              GROUP BY u.email
              ORDER BY conv_count ASC
              LIMIT 1
            `);
              if (cskhUsers.length > 0) {
                assigned_to = cskhUsers[0].email;
              }
            }
          }

          // Fetch Customer Profile via conversations/participants (works for PSIDs)
          let customer_name = 'Khách hàng FB';
          let customer_avatar = null;
          try {
            // Method 1: Get name from conversations participants
            const convSearchRes = await fetch(
              `https://graph.facebook.com/v25.0/${page_id}/conversations?user_id=${sender_psid}&fields=participants&access_token=${page.access_token}`
            );
            const convSearchData = await convSearchRes.json();
            console.log(`[PROFILE_FETCH] Method 1 result for ${sender_psid}:`, JSON.stringify(convSearchData).substring(0, 200));

            if (convSearchData.data && convSearchData.data.length > 0) {
              const participants = convSearchData.data[0].participants?.data || [];
              const userParticipant = participants.find((p: any) => p.id === sender_psid);
              if (userParticipant?.name) {
                customer_name = userParticipant.name;
                console.log(`[PROFILE] Got name from participants: ${customer_name}`);
              }
            }

            // Method 2: Try direct profile (works for some users)
            if (customer_name === 'Khách hàng FB' || !customer_avatar) {
              const profileRes = await fetch(
                `https://graph.facebook.com/v25.0/${sender_psid}?fields=name,profile_pic&access_token=${page.access_token}`
              );
              const profileData = await profileRes.json();
              console.log(`[PROFILE_FETCH] Method 2 result for ${sender_psid}:`, JSON.stringify(profileData));

              if (profileData.name && customer_name === 'Khách hàng FB') customer_name = profileData.name;
              if (profileData.profile_pic) {
                customer_avatar = `/api/fb/avatar-proxy?url=${encodeURIComponent(profileData.profile_pic)}`;
              }
            }

            console.log(`[PROFILE] Final: name=${customer_name}, has_avatar=${!!customer_avatar}`);
          } catch (err) {
            console.error('Error fetching FB profile:', err);
          }

          // Upsert Conversation
          let dify_conversation_id = null;
          let is_human_intervened = false;

          const { rows: convs } = await pool.query(
            `INSERT INTO fb_conversations (
              page_id, customer_id, customer_name, customer_avatar, last_message, unread_count, assigned_to,
              ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name, creative_id,
              ad_image, ad_message, ad_permalink_url, ad_source_status, ad_source_error, ad_referral_raw, ad_source_updated_at
            ) VALUES ($1,$2,$3,$4,$5,1,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
            ON CONFLICT (page_id, customer_id) DO UPDATE SET
              customer_name = CASE WHEN fb_conversations.customer_name = 'Khách hàng FB' OR fb_conversations.customer_name IS NULL THEN EXCLUDED.customer_name ELSE fb_conversations.customer_name END,
              customer_avatar = COALESCE(EXCLUDED.customer_avatar, fb_conversations.customer_avatar),
              last_message = EXCLUDED.last_message,
              last_message_at = CURRENT_TIMESTAMP,
              unread_count = fb_conversations.unread_count + 1,
              assigned_to = COALESCE(fb_conversations.assigned_to, EXCLUDED.assigned_to),
              ad_id = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.ad_id ELSE fb_conversations.ad_id END,
              ad_name = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.ad_name ELSE fb_conversations.ad_name END,
              adset_id = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.adset_id ELSE fb_conversations.adset_id END,
              adset_name = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.adset_name ELSE fb_conversations.adset_name END,
              campaign_id = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.campaign_id ELSE fb_conversations.campaign_id END,
              campaign_name = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.campaign_name ELSE fb_conversations.campaign_name END,
              creative_id = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.creative_id ELSE fb_conversations.creative_id END,
              ad_image = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.ad_image ELSE fb_conversations.ad_image END,
              ad_message = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.ad_message ELSE fb_conversations.ad_message END,
              ad_permalink_url = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.ad_permalink_url ELSE fb_conversations.ad_permalink_url END,
              ad_source_status = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.ad_source_status ELSE fb_conversations.ad_source_status END,
              ad_source_error = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.ad_source_error ELSE fb_conversations.ad_source_error END,
              ad_referral_raw = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN EXCLUDED.ad_referral_raw ELSE fb_conversations.ad_referral_raw END,
              ad_source_updated_at = CASE WHEN EXCLUDED.ad_id IS NOT NULL THEN CURRENT_TIMESTAMP ELSE fb_conversations.ad_source_updated_at END
            RETURNING id, dify_conversation_id, is_human_intervened`,
            [
              page_id, sender_psid, customer_name, customer_avatar, messageText, assigned_to,
              adSource?.ad_id || null, adSource?.ad_name || null, adSource?.adset_id || null,
              adSource?.adset_name || null, adSource?.campaign_id || null, adSource?.campaign_name || null,
              adSource?.creative_id || null, adSource?.ad_image || null, adSource?.ad_message || null,
              adSource?.ad_permalink_url || null, adSource?.status || null, adSource?.error_message || null,
              adSource?.referral_raw ? JSON.stringify(adSource.referral_raw) : null,
              adSource?.ad_id ? new Date() : null
            ]
          );

          const convId = convs[0].id;
          await upsertConversationAdSource(convId, page_id, sender_psid, adSource);
          dify_conversation_id = convs[0].dify_conversation_id;
          is_human_intervened = convs[0].is_human_intervened;

          // --- AI SCHEDULE CHECK ---
          let isWithinAISchedule = true;
          if (page.ai_start_hour !== undefined && page.ai_end_hour !== undefined) {
            const vnHour = (new Date().getUTCHours() + 7) % 24;
            const start = page.ai_start_hour;
            const end = page.ai_end_hour;
            
            if (start < end) {
              isWithinAISchedule = vnHour >= start && vnHour < end;
            } else {
              // Midnight overlap (e.g., 17 to 08)
              isWithinAISchedule = vnHour >= start || vnHour < end;
            }
          }

          // Insert Message
          await pool.query(
            `INSERT INTO fb_messages (
              conversation_id, sender_type, message_text, attachment_type, attachment_url, attachment_payload, facebook_attachment_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [convId, 'user', messageText, attachmentType, attachmentUrl, supportedAttachment ? JSON.stringify(supportedAttachment.payload || {}) : null, facebookAttachmentId]
          );

          // --- DIFY AI BATCHING LOGIC (5s delay to group messages) ---
          if (!is_human_intervened && page.dify_api_key && isWithinAISchedule) {
            const queueKey = `${page_id}_${sender_psid}`;
            const existing = difyBatchQueues.get(queueKey);

            if (existing) {
              clearTimeout(existing.timer);
              existing.messages.push(messageText);
            } else {
              difyBatchQueues.set(queueKey, {
                messages: [messageText],
                timer: null as any
              });
            }

            const currentQueue = difyBatchQueues.get(queueKey)!;
            currentQueue.timer = setTimeout(async () => {
              try {
                const combinedMessage = currentQueue.messages.join('\n');
                difyBatchQueues.delete(queueKey);

                // Re-check human intervention from DB before calling AI
                const { rows: checkConv } = await pool.query('SELECT is_human_intervened, dify_conversation_id FROM fb_conversations WHERE id = $1', [convId]);
                if (checkConv.length > 0 && checkConv[0].is_human_intervened) {
                  console.log(`[DIFY_BATCH] Human intervened, cancelling AI response for ${sender_psid}`);
                  return;
                }

                const currentDifyConvId = checkConv[0]?.dify_conversation_id;

                console.log(`[DIFY_BATCH] Sending combined message for ${sender_psid}: ${combinedMessage}`);

                const difyRes = await fetch('https://dify.movads.vn/v1/chat-messages', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${page.dify_api_key}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    inputs: {},
                    query: combinedMessage,
                    response_mode: 'blocking',
                    conversation_id: currentDifyConvId || '',
                    user: sender_psid
                  })
                });

                const difyData = await difyRes.json();

                if (difyData.answer) {
                  const aiReply = difyData.answer;
                  const newDifyConvId = difyData.conversation_id;

                  // Send back to FB first. Only persist the AI reply as sent when Facebook accepts it.
                  console.log(`[DIFY_SEND] Using token for page ${page_id} to send to ${sender_psid}`);
                  const fbSendRes = await fetch(`https://graph.facebook.com/v25.0/me/messages?access_token=${page.access_token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      messaging_type: 'RESPONSE',
                      recipient: { id: sender_psid },
                      message: {
                        text: aiReply,
                        metadata: 'SENT_BY_AI'
                      }
                    })
                  });
                  const fbSendData = await fbSendRes.json();
                  console.log('FB AI Send Response (Batched):', JSON.stringify(fbSendData));

                  if (!fbSendRes.ok || fbSendData.error) {
                    console.error('[FB_SEND_ERROR]', JSON.stringify(fbSendData));
                    await pool.query(
                      `UPDATE fb_conversations SET last_message = $1, last_message_at = CURRENT_TIMESTAMP WHERE id = $2`,
                      [`[Lỗi gửi Facebook] ${fbSendData.error?.message || 'Không gửi được tin nhắn'}`, convId]
                    );
                    return;
                  }

                  // Save AI Message after successful Facebook delivery
                  await pool.query(
                    `INSERT INTO fb_messages (conversation_id, sender_type, message_text) VALUES ($1, $2, $3)`,
                    [convId, 'ai', aiReply]
                  );

                  // Update conversation_id and last message
                  await pool.query(
                    `UPDATE fb_conversations SET dify_conversation_id = $1, last_message = $2, last_message_at = CURRENT_TIMESTAMP WHERE id = $3`,
                    [newDifyConvId, aiReply, convId]
                  );
                }
              } catch (err) {
                console.error('Dify Batch Processing Error:', err);
              }
            }, 5000);
          }
        }
      }
      } catch (error) {
      console.error('Error processing webhook:', error);
    }
  })();
  } else {
  res.sendStatus(404);
}
});

// ─── FETCH CONVERSATIONS & MESSAGES ───

router.get('/reports/cskh-personal', async (req, res) => {
  try {
    const range = String(req.query.range || 'Tháng này').trim();
    const email = String(req.query.email || '').trim().toLowerCase();
    const name = String(req.query.name || '').trim().toLowerCase() || email;

    if (!email) {
      return res.status(400).json({ error: 'Email nhân viên là bắt buộc.' });
    }

    const conversationDateFilter = getReportDateFilter(range, 'c.last_message_at', req.query.startDate, req.query.endDate);
    const messageDateFilter = getReportDateFilter(range, 'm.created_at', req.query.startDate, req.query.endDate);
    const noteDateFilter = getReportDateFilter(range, 'n.created_at', req.query.startDate, req.query.endDate);
    const orderDateFilter = getReportDateFilter(range, 'o.created_at', req.query.startDate, req.query.endDate);
    const firstMessageDateFilter = getReportDateFilter(range, 'first_message_at', req.query.startDate, req.query.endDate);
    const params = [email, name];

    const staffAssignmentFilter = `
      (
        LOWER(COALESCE(c.assigned_to, '')) IN ($1, $2)
        OR LOWER(COALESCE(u.email, '')) = $1
        OR LOWER(COALESCE(u.name, '')) = $2
      )
    `;
    const staffMessageFilter = `
      (
        LOWER(COALESCE(m.sender_email, '')) = $1
        OR LOWER(COALESCE(m.sender_name, '')) = $2
      )
    `;
    const staffNoteFilter = `
      (
        LOWER(COALESCE(n.author_email, '')) = $1
        OR LOWER(COALESCE(n.author_name, '')) = $2
      )
    `;
    const staffOrderFilter = `
      (
        LOWER(COALESCE(o.created_by, '')) = $1
        OR LOWER(COALESCE(o.created_by_name, '')) = $2
      )
    `;

    const summaryResult = await pool.query(
      `
        WITH assigned_conversations AS (
          SELECT DISTINCT
            c.id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name
          FROM fb_conversations c
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          LEFT JOIN users u ON LOWER(u.email) = LOWER(c.assigned_to) OR LOWER(u.name) = LOWER(c.assigned_to)
          WHERE ${staffAssignmentFilter}
            AND ${conversationDateFilter}
        ),
        customer_first_messages AS (
          SELECT
            c.id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name,
            MIN(m.created_at) AS first_message_at
          FROM fb_messages m
          JOIN fb_conversations c ON c.id = m.conversation_id
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          LEFT JOIN users u ON LOWER(u.email) = LOWER(c.assigned_to) OR LOWER(u.name) = LOWER(c.assigned_to)
          WHERE m.sender_type = 'user'
            AND ${staffAssignmentFilter}
          GROUP BY c.id, c.page_id, p.page_name
        ),
        new_customer_conversations AS (
          SELECT id, page_id, page_name
          FROM customer_first_messages
          WHERE ${firstMessageDateFilter}
        ),
        staff_messages AS (
          SELECT
            m.id,
            m.conversation_id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name
          FROM fb_messages m
          JOIN fb_conversations c ON c.id = m.conversation_id
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          WHERE m.sender_type = 'human'
            AND ${staffMessageFilter}
            AND ${messageDateFilter}
        ),
        staff_notes AS (
          SELECT
            n.id,
            n.conversation_id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name
          FROM fb_conversation_notes n
          JOIN fb_conversations c ON c.id = n.conversation_id
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          WHERE ${staffNoteFilter}
            AND ${noteDateFilter}
        ),
        staff_orders AS (
          SELECT o.id, COALESCE(o.total_amount, 0) AS total_amount
          FROM orders o
          WHERE ${staffOrderFilter}
            AND ${orderDateFilter}
        ),
        active_conversations AS (
          SELECT id, page_id, page_name FROM assigned_conversations
          UNION
          SELECT conversation_id AS id, page_id, page_name FROM staff_messages
          UNION
          SELECT conversation_id AS id, page_id, page_name FROM staff_notes
        )
        SELECT
          (SELECT COUNT(*)::int FROM assigned_conversations) AS assigned_conversation_count,
          (SELECT COUNT(*)::int FROM new_customer_conversations) AS new_customer_count,
          (SELECT COUNT(DISTINCT conversation_id)::int FROM staff_messages) AS handled_conversation_count,
          (SELECT COUNT(*)::int FROM staff_messages) AS sent_message_count,
          (SELECT COUNT(*)::int FROM staff_notes) AS note_count,
          (SELECT COUNT(*)::int FROM staff_orders) AS order_count,
          (SELECT COALESCE(SUM(total_amount), 0) FROM staff_orders) AS revenue,
          (SELECT COUNT(DISTINCT id)::int FROM active_conversations) AS active_conversation_count,
          (SELECT COUNT(DISTINCT page_id)::int FROM active_conversations) AS page_count
      `,
      params
    );

    const byPageResult = await pool.query(
      `
        WITH assigned_conversations AS (
          SELECT DISTINCT
            c.id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name,
            c.last_message_at AS activity_at
          FROM fb_conversations c
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          LEFT JOIN users u ON LOWER(u.email) = LOWER(c.assigned_to) OR LOWER(u.name) = LOWER(c.assigned_to)
          WHERE ${staffAssignmentFilter}
            AND ${conversationDateFilter}
        ),
        customer_first_messages AS (
          SELECT
            c.id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name,
            MIN(m.created_at) AS first_message_at
          FROM fb_messages m
          JOIN fb_conversations c ON c.id = m.conversation_id
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          LEFT JOIN users u ON LOWER(u.email) = LOWER(c.assigned_to) OR LOWER(u.name) = LOWER(c.assigned_to)
          WHERE m.sender_type = 'user'
            AND ${staffAssignmentFilter}
          GROUP BY c.id, c.page_id, p.page_name
        ),
        new_customer_conversations AS (
          SELECT id, page_id, page_name, first_message_at AS activity_at
          FROM customer_first_messages
          WHERE ${firstMessageDateFilter}
        ),
        staff_messages AS (
          SELECT
            m.id,
            m.conversation_id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name,
            m.created_at AS activity_at
          FROM fb_messages m
          JOIN fb_conversations c ON c.id = m.conversation_id
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          WHERE m.sender_type = 'human'
            AND ${staffMessageFilter}
            AND ${messageDateFilter}
        ),
        staff_notes AS (
          SELECT
            n.id,
            n.conversation_id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name,
            n.created_at AS activity_at
          FROM fb_conversation_notes n
          JOIN fb_conversations c ON c.id = n.conversation_id
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          WHERE ${staffNoteFilter}
            AND ${noteDateFilter}
        ),
        active_conversations AS (
          SELECT id, page_id, page_name, activity_at FROM assigned_conversations
          UNION
          SELECT conversation_id AS id, page_id, page_name, activity_at FROM staff_messages
          UNION
          SELECT conversation_id AS id, page_id, page_name, activity_at FROM staff_notes
        ),
        page_metrics AS (
          SELECT
            page_id,
            page_name,
            COUNT(DISTINCT id)::int AS active_conversation_count,
            0::int AS new_customer_count,
            0::int AS sent_message_count,
            0::int AS note_count,
            MAX(activity_at) AS last_activity_at
          FROM active_conversations
          GROUP BY page_id, page_name
          UNION ALL
          SELECT
            page_id,
            page_name,
            0::int,
            COUNT(DISTINCT id)::int,
            0::int,
            0::int,
            MAX(activity_at)
          FROM new_customer_conversations
          GROUP BY page_id, page_name
          UNION ALL
          SELECT
            page_id,
            page_name,
            0::int,
            0::int,
            COUNT(*)::int,
            0::int,
            MAX(activity_at)
          FROM staff_messages
          GROUP BY page_id, page_name
          UNION ALL
          SELECT
            page_id,
            page_name,
            0::int,
            0::int,
            0::int,
            COUNT(*)::int,
            MAX(activity_at)
          FROM staff_notes
          GROUP BY page_id, page_name
        )
        SELECT
          page_id,
          page_name,
          SUM(new_customer_count)::int AS new_customer_count,
          SUM(active_conversation_count)::int AS active_conversation_count,
          SUM(sent_message_count)::int AS sent_message_count,
          SUM(note_count)::int AS note_count,
          MAX(last_activity_at) AS last_activity_at
        FROM page_metrics
        GROUP BY page_id, page_name
        ORDER BY sent_message_count DESC, new_customer_count DESC, page_name ASC
      `,
      params
    );

    const recentResult = await pool.query(
      `
        WITH assigned_conversations AS (
          SELECT DISTINCT c.id
          FROM fb_conversations c
          LEFT JOIN users u ON LOWER(u.email) = LOWER(c.assigned_to) OR LOWER(u.name) = LOWER(c.assigned_to)
          WHERE ${staffAssignmentFilter}
            AND ${conversationDateFilter}
        ),
        staff_messages AS (
          SELECT
            m.conversation_id,
            COUNT(*)::int AS sent_message_count,
            MAX(m.created_at) AS last_staff_message_at
          FROM fb_messages m
          WHERE m.sender_type = 'human'
            AND ${staffMessageFilter}
            AND ${messageDateFilter}
          GROUP BY m.conversation_id
        ),
        staff_notes AS (
          SELECT
            n.conversation_id,
            COUNT(*)::int AS note_count,
            MAX(n.created_at) AS last_note_at
          FROM fb_conversation_notes n
          WHERE ${staffNoteFilter}
            AND ${noteDateFilter}
          GROUP BY n.conversation_id
        ),
        active_ids AS (
          SELECT id FROM assigned_conversations
          UNION
          SELECT conversation_id AS id FROM staff_messages
          UNION
          SELECT conversation_id AS id FROM staff_notes
        )
        SELECT
          c.id,
          c.customer_name,
          c.customer_id,
          c.page_id,
          COALESCE(p.page_name, c.page_id) AS page_name,
          c.customer_status,
          c.last_message_at,
          COALESCE(sm.sent_message_count, 0)::int AS sent_message_count,
          COALESCE(sn.note_count, 0)::int AS note_count,
          GREATEST(
            COALESCE(sm.last_staff_message_at, TIMESTAMP '1970-01-01'),
            COALESCE(sn.last_note_at, TIMESTAMP '1970-01-01'),
            COALESCE(c.last_message_at, TIMESTAMP '1970-01-01')
          ) AS last_activity_at
        FROM active_ids a
        JOIN fb_conversations c ON c.id = a.id
        LEFT JOIN fb_pages p ON p.page_id = c.page_id
        LEFT JOIN staff_messages sm ON sm.conversation_id = c.id
        LEFT JOIN staff_notes sn ON sn.conversation_id = c.id
        ORDER BY last_activity_at DESC
        LIMIT 8
      `,
      params
    );

    const summary = summaryResult.rows[0] || {};
    res.json({
      range: range || 'Tháng này',
      staff: {
        email,
        name: req.query.name ? String(req.query.name).trim() : email
      },
      summary: {
        assigned_conversation_count: Number(summary.assigned_conversation_count || 0),
        active_conversation_count: Number(summary.active_conversation_count || 0),
        handled_conversation_count: Number(summary.handled_conversation_count || 0),
        new_customer_count: Number(summary.new_customer_count || 0),
        sent_message_count: Number(summary.sent_message_count || 0),
        note_count: Number(summary.note_count || 0),
        order_count: Number(summary.order_count || 0),
        revenue: Number(summary.revenue || 0),
        page_count: Number(summary.page_count || 0)
      },
      byPage: byPageResult.rows,
      recentConversations: recentResult.rows
    });
  } catch (err: any) {
    console.error('Error fetching CSKH personal report:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/page-performance', async (req, res) => {
  try {
    const range = String(req.query.range || 'Tháng này').trim();
    const messageDateFilter = getReportDateFilter(range, 'm.created_at', req.query.startDate, req.query.endDate);
    const firstMessageDateFilter = getReportDateFilter(range, 'first_message_at', req.query.startDate, req.query.endDate);
    const conversationDateFilter = getReportDateFilter(range, 'c.last_message_at', req.query.startDate, req.query.endDate);
    const orderDateFilter = getReportDateFilter(range, 'o.created_at', req.query.startDate, req.query.endDate);
    const adSourceDateFilter = getReportDateFilter(range, 's.last_seen_at', req.query.startDate, req.query.endDate);

    const { rows } = await pool.query(`
      WITH page_base AS (
        SELECT page_id, COALESCE(NULLIF(page_name, ''), page_id) AS page_name
        FROM fb_pages
      ),
      message_metrics AS (
        SELECT
          c.page_id,
          COUNT(m.id)::int AS message_count,
          COUNT(m.id) FILTER (WHERE m.sender_type = 'user')::int AS inbound_message_count,
          COUNT(m.id) FILTER (WHERE m.sender_type = 'human')::int AS human_message_count,
          COUNT(m.id) FILTER (WHERE m.sender_type = 'ai')::int AS ai_message_count,
          COUNT(DISTINCT m.conversation_id)::int AS active_conversation_count,
          COUNT(DISTINCT NULLIF(LOWER(COALESCE(NULLIF(m.sender_email, ''), NULLIF(m.sender_name, ''), '')), ''))
            FILTER (WHERE m.sender_type = 'human') AS staff_count,
          MAX(m.created_at) AS last_message_at
        FROM fb_messages m
        JOIN fb_conversations c ON c.id = m.conversation_id
        WHERE ${messageDateFilter}
        GROUP BY c.page_id
      ),
      customer_first_messages AS (
        SELECT
          c.id AS conversation_id,
          c.page_id,
          c.ad_id,
          MIN(m.created_at) AS first_message_at
        FROM fb_messages m
        JOIN fb_conversations c ON c.id = m.conversation_id
        WHERE m.sender_type = 'user'
        GROUP BY c.id, c.page_id, c.ad_id
      ),
      new_customer_metrics AS (
        SELECT
          page_id,
          COUNT(*)::int AS new_customer_count,
          COUNT(*) FILTER (WHERE ad_id IS NOT NULL)::int AS ad_customer_count,
          MAX(first_message_at) AS last_new_customer_at
        FROM customer_first_messages
        WHERE ${firstMessageDateFilter}
        GROUP BY page_id
      ),
      conversation_metrics AS (
        SELECT
          c.page_id,
          COUNT(*)::int AS conversation_count,
          COUNT(*) FILTER (WHERE c.ad_id IS NOT NULL)::int AS ad_conversation_count,
          COALESCE(SUM(COALESCE(c.ad_cost, 0)), 0) AS ad_cost,
          MAX(c.last_message_at) AS last_conversation_at
        FROM fb_conversations c
        WHERE ${conversationDateFilter}
        GROUP BY c.page_id
      ),
      ad_source_metrics AS (
        SELECT
          s.page_id,
          COUNT(DISTINCT NULLIF(s.ad_id, ''))::int AS ad_count,
          COALESCE(SUM(COALESCE(s.click_count, 0)), 0)::int AS ad_click_count,
          MAX(s.last_seen_at) AS last_ad_seen_at
        FROM fb_conversation_ad_sources s
        WHERE ${adSourceDateFilter}
        GROUP BY s.page_id
      ),
      customer_page_candidates AS (
        SELECT
          cust.id AS customer_row_id,
          c.page_id,
          ROW_NUMBER() OVER (
            PARTITION BY cust.id
            ORDER BY
              CASE
                WHEN NULLIF(cust.facebook_uid, '') IS NOT NULL AND c.facebook_uid = cust.facebook_uid THEN 0
                WHEN NULLIF(cust.conversation_id, '') IS NOT NULL AND c.customer_id = cust.conversation_id THEN 1
                ELSE 2
              END,
              c.last_message_at DESC NULLS LAST,
              c.id DESC
          ) AS rn
        FROM customers cust
        JOIN fb_conversations c ON (
          (NULLIF(cust.facebook_uid, '') IS NOT NULL AND (c.facebook_uid = cust.facebook_uid OR c.customer_id = cust.facebook_uid))
          OR (NULLIF(cust.conversation_id, '') IS NOT NULL AND (c.customer_id = cust.conversation_id OR c.facebook_uid = cust.conversation_id))
        )
      ),
      customer_page_links AS (
        SELECT customer_row_id, page_id
        FROM customer_page_candidates
        WHERE rn = 1
      ),
      order_customer_candidates AS (
        SELECT
          o.id AS order_row_id,
          COALESCE(o.total_amount, 0) AS total_amount,
          o.created_at,
          cust.id AS customer_row_id,
          ROW_NUMBER() OVER (
            PARTITION BY o.id
            ORDER BY
              CASE
                WHEN NULLIF(o.customer_id, '') IS NOT NULL AND cust.skymobile_customer_id::text = o.customer_id THEN 0
                ELSE 1
              END,
              cust.created_at DESC NULLS LAST,
              cust.id DESC
          ) AS rn
        FROM orders o
        LEFT JOIN customers cust ON (
          (NULLIF(o.customer_id, '') IS NOT NULL AND cust.skymobile_customer_id::text = o.customer_id)
          OR (
            NULLIF(o.customer_name, '') IS NOT NULL
            AND NULLIF(cust.customer_name, '') IS NOT NULL
            AND LOWER(cust.customer_name) = LOWER(o.customer_name)
          )
        )
        WHERE ${orderDateFilter}
      ),
      order_page_rows AS (
        SELECT
          occ.order_row_id,
          occ.total_amount,
          occ.created_at,
          occ.customer_row_id,
          COALESCE(cpl.page_id, 'unassigned') AS page_id
        FROM order_customer_candidates occ
        LEFT JOIN customer_page_links cpl ON cpl.customer_row_id = occ.customer_row_id
        WHERE occ.rn = 1
      ),
      order_metrics AS (
        SELECT
          page_id,
          COUNT(DISTINCT order_row_id)::int AS order_count,
          COUNT(DISTINCT customer_row_id) FILTER (WHERE customer_row_id IS NOT NULL)::int AS revenue_customer_count,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COALESCE(AVG(total_amount), 0) AS average_order_value,
          MAX(created_at) AS last_order_at
        FROM order_page_rows
        GROUP BY page_id
      ),
      page_metrics AS (
        SELECT
          pb.page_id,
          pb.page_name,
          COALESCE(conv.conversation_count, 0)::int AS conversation_count,
          COALESCE(msg.active_conversation_count, 0)::int AS active_conversation_count,
          COALESCE(nc.new_customer_count, 0)::int AS new_customer_count,
          COALESCE(msg.message_count, 0)::int AS message_count,
          COALESCE(msg.inbound_message_count, 0)::int AS inbound_message_count,
          COALESCE(msg.human_message_count, 0)::int AS human_message_count,
          COALESCE(msg.ai_message_count, 0)::int AS ai_message_count,
          COALESCE(msg.staff_count, 0)::int AS staff_count,
          COALESCE(ord.order_count, 0)::int AS order_count,
          COALESCE(ord.revenue_customer_count, 0)::int AS revenue_customer_count,
          COALESCE(ord.revenue, 0) AS revenue,
          COALESCE(ord.average_order_value, 0) AS average_order_value,
          COALESCE(conv.ad_cost, 0) AS ad_cost,
          COALESCE(conv.ad_conversation_count, 0)::int AS ad_conversation_count,
          COALESCE(nc.ad_customer_count, 0)::int AS ad_customer_count,
          COALESCE(src.ad_count, 0)::int AS ad_count,
          COALESCE(src.ad_click_count, 0)::int AS ad_click_count,
          CASE
            WHEN COALESCE(conv.ad_cost, 0) > 0 THEN ROUND((COALESCE(ord.revenue, 0) / COALESCE(conv.ad_cost, 0))::numeric, 2)
            ELSE 0
          END AS roas,
          COALESCE(ord.revenue, 0) - COALESCE(conv.ad_cost, 0) AS profit_after_ads,
          CASE
            WHEN COALESCE(nc.new_customer_count, 0) > 0 THEN ROUND((COALESCE(conv.ad_cost, 0) / COALESCE(nc.new_customer_count, 0))::numeric, 0)
            ELSE 0
          END AS cost_per_customer,
          CASE
            WHEN COALESCE(msg.message_count, 0) > 0 THEN ROUND((COALESCE(conv.ad_cost, 0) / COALESCE(msg.message_count, 0))::numeric, 0)
            ELSE 0
          END AS cost_per_message,
          NULLIF(GREATEST(
            COALESCE(msg.last_message_at, TIMESTAMP '1970-01-01'),
            COALESCE(nc.last_new_customer_at, TIMESTAMP '1970-01-01'),
            COALESCE(conv.last_conversation_at, TIMESTAMP '1970-01-01'),
            COALESCE(ord.last_order_at, TIMESTAMP '1970-01-01'),
            COALESCE(src.last_ad_seen_at, TIMESTAMP '1970-01-01')
          ), TIMESTAMP '1970-01-01') AS last_activity_at
        FROM page_base pb
        LEFT JOIN message_metrics msg ON msg.page_id = pb.page_id
        LEFT JOIN new_customer_metrics nc ON nc.page_id = pb.page_id
        LEFT JOIN conversation_metrics conv ON conv.page_id = pb.page_id
        LEFT JOIN ad_source_metrics src ON src.page_id = pb.page_id
        LEFT JOIN order_metrics ord ON ord.page_id = pb.page_id
      )
      SELECT *
      FROM page_metrics
      UNION ALL
      SELECT
        'unassigned' AS page_id,
        'Chưa xác định Page' AS page_name,
        0::int AS conversation_count,
        0::int AS active_conversation_count,
        0::int AS new_customer_count,
        0::int AS message_count,
        0::int AS inbound_message_count,
        0::int AS human_message_count,
        0::int AS ai_message_count,
        0::int AS staff_count,
        COALESCE(order_count, 0)::int AS order_count,
        COALESCE(revenue_customer_count, 0)::int AS revenue_customer_count,
        COALESCE(revenue, 0) AS revenue,
        COALESCE(average_order_value, 0) AS average_order_value,
        0 AS ad_cost,
        0::int AS ad_conversation_count,
        0::int AS ad_customer_count,
        0::int AS ad_count,
        0::int AS ad_click_count,
        0 AS roas,
        COALESCE(revenue, 0) AS profit_after_ads,
        0 AS cost_per_customer,
        0 AS cost_per_message,
        last_order_at AS last_activity_at
      FROM order_metrics
      WHERE page_id = 'unassigned'
        AND (COALESCE(order_count, 0) > 0 OR COALESCE(revenue, 0) > 0)
      ORDER BY revenue DESC, message_count DESC, page_name ASC
    `);

    const toNumber = (value: unknown) => Number(value || 0);
    const normalizedRows = rows.map(row => ({
      page_id: String(row.page_id || ''),
      page_name: String(row.page_name || 'Fanpage'),
      conversation_count: toNumber(row.conversation_count),
      active_conversation_count: toNumber(row.active_conversation_count),
      new_customer_count: toNumber(row.new_customer_count),
      message_count: toNumber(row.message_count),
      inbound_message_count: toNumber(row.inbound_message_count),
      human_message_count: toNumber(row.human_message_count),
      ai_message_count: toNumber(row.ai_message_count),
      staff_count: toNumber(row.staff_count),
      order_count: toNumber(row.order_count),
      revenue_customer_count: toNumber(row.revenue_customer_count),
      revenue: toNumber(row.revenue),
      average_order_value: toNumber(row.average_order_value),
      ad_cost: toNumber(row.ad_cost),
      ad_conversation_count: toNumber(row.ad_conversation_count),
      ad_customer_count: toNumber(row.ad_customer_count),
      ad_count: toNumber(row.ad_count),
      ad_click_count: toNumber(row.ad_click_count),
      roas: toNumber(row.roas),
      profit_after_ads: toNumber(row.profit_after_ads),
      cost_per_customer: toNumber(row.cost_per_customer),
      cost_per_message: toNumber(row.cost_per_message),
      last_activity_at: row.last_activity_at || null
    }));

    const summary = normalizedRows.reduce((acc, row) => {
      acc.page_count += row.page_id === 'unassigned' ? 0 : 1;
      acc.conversation_count += row.conversation_count;
      acc.active_conversation_count += row.active_conversation_count;
      acc.new_customer_count += row.new_customer_count;
      acc.message_count += row.message_count;
      acc.inbound_message_count += row.inbound_message_count;
      acc.human_message_count += row.human_message_count;
      acc.ai_message_count += row.ai_message_count;
      acc.staff_count += row.staff_count;
      acc.order_count += row.order_count;
      acc.revenue_customer_count += row.revenue_customer_count;
      acc.revenue += row.revenue;
      acc.ad_cost += row.ad_cost;
      acc.ad_conversation_count += row.ad_conversation_count;
      acc.ad_customer_count += row.ad_customer_count;
      acc.ad_count += row.ad_count;
      acc.ad_click_count += row.ad_click_count;
      acc.profit_after_ads += row.profit_after_ads;
      return acc;
    }, {
      page_count: 0,
      conversation_count: 0,
      active_conversation_count: 0,
      new_customer_count: 0,
      message_count: 0,
      inbound_message_count: 0,
      human_message_count: 0,
      ai_message_count: 0,
      staff_count: 0,
      order_count: 0,
      revenue_customer_count: 0,
      revenue: 0,
      ad_cost: 0,
      ad_conversation_count: 0,
      ad_customer_count: 0,
      ad_count: 0,
      ad_click_count: 0,
      profit_after_ads: 0
    });

    res.json({
      range: range || 'Tháng này',
      rows: normalizedRows,
      summary: {
        ...summary,
        average_order_value: summary.order_count > 0 ? Math.round(summary.revenue / summary.order_count) : 0,
        roas: summary.ad_cost > 0 ? Number((summary.revenue / summary.ad_cost).toFixed(2)) : 0,
        cost_per_customer: summary.new_customer_count > 0 ? Math.round(summary.ad_cost / summary.new_customer_count) : 0,
        cost_per_message: summary.message_count > 0 ? Math.round(summary.ad_cost / summary.message_count) : 0
      }
    });
  } catch (err: any) {
    console.error('Error fetching page performance report:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/new-messages', async (req, res) => {
  try {
    const range = String(req.query.range || 'Tháng này').trim();
    const email = String(req.query.email || '').trim().toLowerCase();
    const name = String(req.query.name || '').trim().toLowerCase();
    const role = String(req.query.role || '').trim();
    const personalOnly = isTruthyQueryValue(req.query.personal);
    const dateFilter = getReportDateFilter(range, 'first_message_at', req.query.startDate, req.query.endDate);

    if (personalOnly && !email) {
      return res.status(400).json({ error: 'Email nhân viên là bắt buộc.' });
    }

    const params: any[] = [];
    let scopeFilter = '';
    if (email && (personalOnly || !canViewAllMessengerReports(role))) {
      params.push(email);
      const emailParam = `$${params.length}`;
      params.push(name || email);
      const nameParam = `$${params.length}`;
      scopeFilter = personalOnly
        ? `
          AND (
            LOWER(COALESCE(staff_email, '')) = ${emailParam}
            OR LOWER(COALESCE(staff_name, '')) = ${nameParam}
            OR LOWER(COALESCE(assigned_to, '')) IN (${emailParam}, ${nameParam})
          )
        `
        : `
          AND (
            LOWER(COALESCE(assigned_to, '')) IN (${emailParam}, ${nameParam})
            OR assigned_users ? ${emailParam}
            OR assigned_ads_users ? ${emailParam}
          )
        `;
    }

    const { rows } = await pool.query(
      `
        WITH customer_first_messages AS (
          SELECT
            c.id AS conversation_id,
            c.page_id,
            COALESCE(p.page_name, c.page_id) AS page_name,
            c.customer_id,
            c.assigned_to,
            COALESCE(NULLIF(c.assigned_to, ''), 'Chưa giao') AS staff_key,
            COALESCE(u.name, NULLIF(c.assigned_to, ''), 'Chưa giao') AS staff_name,
            CASE
              WHEN c.assigned_to IS NULL OR c.assigned_to = '' THEN NULL
              WHEN POSITION('@' IN c.assigned_to) > 0 THEN LOWER(c.assigned_to)
              ELSE LOWER(u.email)
            END AS staff_email,
            COALESCE(u.role, '') AS staff_role,
            COALESCE(p.assigned_users, '[]'::jsonb) AS assigned_users,
            COALESCE(p.assigned_ads_users, '[]'::jsonb) AS assigned_ads_users,
            COUNT(m.id)::int AS message_count,
            MIN(m.created_at) AS first_message_at,
            MAX(m.created_at) AS last_message_at
          FROM fb_messages m
          JOIN fb_conversations c ON c.id = m.conversation_id
          LEFT JOIN fb_pages p ON p.page_id = c.page_id
          LEFT JOIN users u ON LOWER(u.email) = LOWER(c.assigned_to) OR LOWER(u.name) = LOWER(c.assigned_to)
          WHERE m.sender_type = 'user'
          GROUP BY
            c.id,
            c.page_id,
            p.page_name,
            c.customer_id,
            c.assigned_to,
            u.name,
            u.email,
            u.role,
            p.assigned_users,
            p.assigned_ads_users
        ),
        first_human_responses AS (
          SELECT
            cfm.conversation_id,
            MIN(reply.created_at) AS first_response_at
          FROM customer_first_messages cfm
          JOIN fb_messages reply ON reply.conversation_id = cfm.conversation_id
            AND reply.sender_type = 'human'
            AND reply.created_at > cfm.first_message_at
          GROUP BY cfm.conversation_id
        )
        SELECT
          cfm.page_id,
          cfm.page_name,
          cfm.staff_key,
          cfm.staff_name,
          cfm.staff_email,
          cfm.staff_role,
          COUNT(*)::int AS customer_count,
          COUNT(*)::int AS conversation_count,
          SUM(cfm.message_count)::int AS message_count,
          COUNT(fhr.first_response_at)::int AS response_count,
          COALESCE(SUM(EXTRACT(EPOCH FROM (fhr.first_response_at - cfm.first_message_at))) FILTER (WHERE fhr.first_response_at IS NOT NULL), 0)::int AS total_response_seconds,
          COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (fhr.first_response_at - cfm.first_message_at))) FILTER (WHERE fhr.first_response_at IS NOT NULL)), 0)::int AS average_response_seconds,
          MIN(cfm.first_message_at) AS first_message_at,
          MAX(cfm.first_message_at) AS last_message_at
        FROM customer_first_messages cfm
        LEFT JOIN first_human_responses fhr ON fhr.conversation_id = cfm.conversation_id
        WHERE ${dateFilter}
          ${scopeFilter}
        GROUP BY
          cfm.page_id,
          cfm.page_name,
          cfm.staff_key,
          cfm.staff_name,
          cfm.staff_email,
          cfm.staff_role
        ORDER BY customer_count DESC, page_name ASC, staff_name ASC
      `,
      params
    );

    const normalizedRows = rows.map((row: any) => ({
      page_id: String(row.page_id || ''),
      page_name: String(row.page_name || 'Fanpage'),
      staff_key: String(row.staff_key || 'Chưa giao'),
      staff_name: String(row.staff_name || 'Chưa giao'),
      staff_email: row.staff_email || null,
      staff_role: String(row.staff_role || ''),
      customer_count: Number(row.customer_count || 0),
      conversation_count: Number(row.conversation_count || 0),
      message_count: Number(row.message_count || 0),
      response_count: Number(row.response_count || 0),
      total_response_seconds: Number(row.total_response_seconds || 0),
      average_response_seconds: Number(row.average_response_seconds || 0),
      first_message_at: row.first_message_at || null,
      last_message_at: row.last_message_at || null
    }));

    const totals = normalizedRows.reduce((acc: any, row: any) => {
      acc.customer_count += Number(row.customer_count || 0);
      acc.conversation_count += Number(row.conversation_count || 0);
      acc.message_count += Number(row.message_count || 0);
      acc.response_count += Number(row.response_count || 0);
      acc.total_response_seconds += Number(row.total_response_seconds || 0);
      if (row.staff_key === 'Chưa giao') acc.unassigned_customer_count += Number(row.customer_count || 0);
      acc.page_ids.add(row.page_id);
      acc.staff_keys.add(row.staff_key);
      return acc;
    }, {
      customer_count: 0,
      conversation_count: 0,
      message_count: 0,
      unassigned_customer_count: 0,
      response_count: 0,
      total_response_seconds: 0,
      page_ids: new Set<string>(),
      staff_keys: new Set<string>()
    });

    res.json({
      range: range || 'Tháng này',
      rows: normalizedRows,
      summary: {
        customer_count: totals.customer_count,
        conversation_count: totals.conversation_count,
        message_count: totals.message_count,
        unassigned_customer_count: totals.unassigned_customer_count,
        response_count: totals.response_count,
        total_response_seconds: totals.total_response_seconds,
        average_response_seconds: totals.response_count > 0 ? Math.round(totals.total_response_seconds / totals.response_count) : 0,
        page_count: totals.page_ids.size,
        staff_count: totals.staff_keys.size
      }
    });
  } catch (err: any) {
    console.error('Error fetching new message report:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations', async (req, res) => {
  try {
    const rawLimit = parseInt(String(req.query.limit || '20'), 10);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 20, 1), 100);
    const before = String(req.query.before || '').trim();
    const pageId = String(req.query.page_id || '').trim();
    const filter = String(req.query.filter || 'all').trim();
    const search = String(req.query.search || '').trim();

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (before) {
      params.push(before);
      whereClauses.push(`c.last_message_at < $${params.length}`);
    }

    if (pageId && pageId !== 'all') {
      params.push(pageId);
      whereClauses.push(`c.page_id = $${params.length}`);
    }

    if (filter === 'unread') {
      whereClauses.push(`COALESCE(c.unread_count, 0) > 0`);
    } else if (filter === 'bot') {
      whereClauses.push(`COALESCE(c.is_human_intervened, false) = false`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClauses.push(`(
        LOWER(COALESCE(c.customer_name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(p.page_name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(c.page_id, '')) LIKE $${params.length}
        OR LOWER(COALESCE(c.customer_id, '')) LIKE $${params.length}
        OR LOWER(COALESCE(c.last_message, '')) LIKE $${params.length}
        OR LOWER(COALESCE(c.assigned_to, '')) LIKE $${params.length}
        OR LOWER(COALESCE(u.name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(c.campaign_name, '')) LIKE $${params.length}
      )`);
    }

    params.push(limit + 1);
    const limitParamIndex = params.length;
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const { rows } = await pool.query(`
      SELECT c.*, p.page_name, p.business_id, u.name AS assigned_to_name
      FROM fb_conversations c
      LEFT JOIN fb_pages p ON p.page_id = c.page_id
      LEFT JOIN users u ON LOWER(u.email) = LOWER(c.assigned_to)
      ${whereSql}
      ORDER BY c.last_message_at DESC
      LIMIT $${limitParamIndex}
    `, params);

    const items = rows.slice(0, limit);
    res.json({
      items,
      hasMore: rows.length > limit,
      nextCursor: items.length > 0 ? items[items.length - 1].last_message_at : null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const before = req.query.before as string;

    let query = 'SELECT * FROM fb_messages WHERE conversation_id = $1';
    let params: any[] = [id];

    if (before) {
      query += ' AND created_at < $2';
      params.push(before);
      query += ' ORDER BY created_at DESC LIMIT $3';
      params.push(limit);
    } else {
      query += ' ORDER BY created_at DESC LIMIT $2';
      params.push(limit);
    }

    const { rows } = await pool.query(query, params);
    // Return them in reverse order (oldest to newest) for the UI
    res.json(rows.reverse().map(mapMessageRow));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/message-attachment-proxy/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { rows } = await pool.query(
      `SELECT attachment_type, attachment_url FROM fb_messages WHERE id = $1`,
      [messageId]
    );

    const attachmentType = String(rows[0]?.attachment_type || '').toLowerCase();
    if (rows.length === 0 || !SUPPORTED_FB_ATTACHMENT_TYPES.includes(attachmentType as any) || !rows[0].attachment_url) {
      return res.status(404).send('Attachment not found');
    }

    const upstream = await fetch(rows[0].attachment_url);
    if (!upstream.ok) return res.status(502).send('Could not fetch attachment');

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err: any) {
    console.error('Attachment proxy error:', err);
    res.status(500).send(err.message || 'Proxy error');
  }
});

router.post('/conversations/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'UPDATE fb_conversations SET unread_count = 0 WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true, conversation: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/conversations/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    await pool.query('UPDATE fb_conversations SET assigned_to = $1 WHERE id = $2', [assigned_to || null, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/conversations/:id/customer-status', async (req, res) => {
  try {
    const { id } = req.params;
    const rawStatus = typeof req.body?.customer_status === 'string' ? req.body.customer_status.trim() : '';
    const customerStatus = rawStatus || null;

    const { rows } = await pool.query(
      'UPDATE fb_conversations SET customer_status = $1 WHERE id = $2 RETURNING *',
      [customerStatus, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ success: true, conversation: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/conversations/:id/preferred-language', async (req, res) => {
  try {
    const { id } = req.params;
    const { languageCode, languageLabel, source } = req.body;

    if (!languageCode || !languageLabel) {
      return res.status(400).json({ error: 'languageCode and languageLabel are required' });
    }

    const finalSource = source === 'detected' || source === 'fallback' ? source : 'manual';
    const confidence = finalSource === 'manual' ? 1 : null;

    const { rows } = await pool.query(
      `UPDATE fb_conversations
       SET preferred_language_code = $1,
           preferred_language_label = $2,
           preferred_language_source = $3,
           preferred_language_confidence = $4,
           preferred_language_updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [languageCode, languageLabel, finalSource, confidence, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ success: true, conversation: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── BOT CONTROL ───

router.post('/conversations/:id/toggle-bot', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_human_intervened } = req.body;
    await pool.query('UPDATE fb_conversations SET is_human_intervened = $1 WHERE id = $2', [is_human_intervened, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/rename', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await pool.query('UPDATE fb_conversations SET customer_name = $1 WHERE id = $2', [name, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CẬP NHẬT PROFILE URL THỦ CÔNG ───

router.post('/conversations/:id/resolve-facebook-uid', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: convRows } = await pool.query(
      `SELECT c.customer_id, c.facebook_uid, p.page_id, p.access_token
       FROM fb_conversations c
       JOIN fb_pages p ON c.page_id = p.page_id
       WHERE c.id = $1`,
      [id]
    );

    if (convRows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { customer_id, facebook_uid, page_id, access_token } = convRows[0];
    if (!customer_id || !page_id || !access_token) {
      return res.status(400).json({ error: 'Missing customer_id, page_id, or page access token' });
    }

    const result = await resolveFacebookUidFromConversationGraph(page_id, customer_id, access_token);

    if (result.resolved && result.facebook_uid) {
      await pool.query(
        `UPDATE fb_conversations SET facebook_uid = $1 WHERE id = $2`,
        [result.facebook_uid, id]
      );
    }

    res.json({
      success: true,
      resolved: result.resolved,
      facebook_uid: result.facebook_uid || facebook_uid || null,
      existing_facebook_uid: facebook_uid || null,
      source: result.source,
      reason: result.reason,
      conversation_id: result.conversation_id,
      conversation_link: result.conversation_link,
      participant_ids: result.participants.map((item: any) => item?.id).filter(Boolean),
      sender_ids: result.senders.map((item: any) => item?.id).filter(Boolean)
    });
  } catch (err: any) {
    console.error('Error resolving Facebook UID:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/manual-profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_url } = req.body;

    if (!profile_url) {
      return res.status(400).json({ error: 'profile_url is required' });
    }

    // Trích xuất UID từ URL Facebook / Meta Business Suite
    // Ưu tiên: Business Suite selected_item_id -> profile.php?id -> /people/{id} -> numeric path -> username Graph API
    let uid: string | null = null;
    let username: string | null = null;
    let avatarUrl: string | null = null;
    let token: string | null = null;
    let currentPageId: string | null = null;
    let businessIdFromUrl: string | null = null;
    let mailboxIdFromUrl: string | null = null;
    let assetIdFromUrl: string | null = null;
    let uidSource = 'none';

    // Lấy page access token và page_id từ conversation để resolve username, cập nhật business_id và thử lấy avatar
    const { rows: convRows } = await pool.query(
      `SELECT c.page_id, p.access_token FROM fb_conversations c
       JOIN fb_pages p ON c.page_id = p.page_id
       WHERE c.id = $1`, [id]
    );
    if (convRows.length > 0) {
      token = convRows[0].access_token;
      currentPageId = convRows[0].page_id;
    }

    // Ưu tiên 3: Parse toàn bộ link Business Suite Inbox
    // Hỗ trợ cả /latest/inbox/all và /latest/inbox/messenger:
    // business.facebook.com/latest/inbox/messenger?...selected_item_id=UID&business_id=...&asset_id=...&mailbox_id=...
    const normalizedProfileUrl = profile_url.trim().replace(/&amp;/g, '&');
    try {
      const parsedUrl = new URL(normalizedProfileUrl.startsWith('http') ? normalizedProfileUrl : `https://${normalizedProfileUrl}`);
      const host = parsedUrl.hostname.replace(/^www\./, '').replace(/^m\./, '');
      const selectedItemId = parsedUrl.searchParams.get('selected_item_id');
      const businessId = parsedUrl.searchParams.get('business_id');
      const mailboxId = parsedUrl.searchParams.get('mailbox_id');
      const assetId = parsedUrl.searchParams.get('asset_id');

      if (host === 'business.facebook.com' && parsedUrl.pathname.includes('/latest/inbox/')) {
        if (selectedItemId && /^\d+$/.test(selectedItemId)) {
          uid = selectedItemId;
          uidSource = 'business_suite_selected_item_id';
        }
        if (businessId && /^\d+$/.test(businessId)) businessIdFromUrl = businessId;
        if (mailboxId && /^\d+$/.test(mailboxId)) mailboxIdFromUrl = mailboxId;
        if (assetId && /^\d+$/.test(assetId)) assetIdFromUrl = assetId;
      }
    } catch (e) {
      const selectedMatch = normalizedProfileUrl.match(/[?&]selected_item_id=(\d+)/);
      const businessMatch = normalizedProfileUrl.match(/[?&]business_id=(\d+)/);
      const mailboxMatch = normalizedProfileUrl.match(/[?&]mailbox_id=(\d+)/);
      const assetMatch = normalizedProfileUrl.match(/[?&]asset_id=(\d+)/);
      if (selectedMatch) {
        uid = selectedMatch[1];
        uidSource = 'business_suite_selected_item_id';
      }
      if (businessMatch) businessIdFromUrl = businessMatch[1];
      if (mailboxMatch) mailboxIdFromUrl = mailboxMatch[1];
      if (assetMatch) assetIdFromUrl = assetMatch[1];
    }

    if (businessIdFromUrl) {
      const pageIdToUpdate = mailboxIdFromUrl || assetIdFromUrl || currentPageId;
      if (pageIdToUpdate) {
        await pool.query(
          `UPDATE fb_pages SET business_id = $1 WHERE page_id = $2`,
          [businessIdFromUrl, pageIdToUpdate]
        );
      }
    }

    // Dạng 1: facebook.com/profile.php?id=XXXXXXXX
    const phpIdMatch = profile_url.match(/profile\.php\?id=(\d+)/);
    if (!uid && phpIdMatch) {
      uid = phpIdMatch[1];
      uidSource = 'profile_php_id';
    }

    // Dạng 2: business.facebook.com/latest/people/XXXXXXXX
    if (!uid) {
      const bizMatch = profile_url.match(/\/people\/(\d+)/);
      if (bizMatch) {
        uid = bizMatch[1];
        uidSource = 'business_people_path';
      }
    }

    // Dạng 3: facebook.com/XXXXXXXX (chỉ số)
    if (!uid) {
      const numMatch = profile_url.match(/facebook\.com\/(\d+)(?:[/?]|$)/);
      if (numMatch) {
        uid = numMatch[1];
        uidSource = 'facebook_numeric_path';
      }
    }

    // Dạng 4: facebook.com/username hoặc fb.com/username
    // Lưu ý: Graph API chỉ resolve được username public và token có quyền nhìn thấy object đó.
    if (!uid) {
      try {
        const parsedUrl = new URL(profile_url.startsWith('http') ? profile_url : `https://${profile_url}`);
        const host = parsedUrl.hostname.replace(/^www\./, '').replace(/^m\./, '');
        const reservedPaths = new Set([
          'profile.php', 'people', 'pages', 'groups', 'events', 'marketplace', 'watch',
          'photo', 'photos', 'videos', 'reel', 'story.php', 'messages', 'plugins'
        ]);
        const firstPath = parsedUrl.pathname.split('/').filter(Boolean)[0];
        if ((host === 'facebook.com' || host === 'fb.com') && firstPath && !reservedPaths.has(firstPath.toLowerCase()) && !/^\d+$/.test(firstPath)) {
          username = decodeURIComponent(firstPath);
        }
      } catch (e) {
        console.warn('[MANUAL_PROFILE] Could not parse profile URL for username:', e);
      }

      if (username && token) {
        try {
          const usernameRes = await fetch(
            `https://graph.facebook.com/v25.0/${encodeURIComponent(username)}?fields=id&access_token=${token}`
          );
          const usernameData = await usernameRes.json();
          if (usernameData?.id && /^\d+$/.test(usernameData.id)) {
            uid = usernameData.id;
            uidSource = 'graph_username_lookup';
          } else if (usernameData?.error) {
            console.warn('[MANUAL_PROFILE] Could not resolve username to UID:', usernameData.error.message);
          }
        } catch (e) {
          console.warn('[MANUAL_PROFILE] Username resolve failed:', e);
        }
      }
    }

    // Nếu có UID số, thử fetch avatar qua Graph API với page token
    if (uid && token) {
      try {
        // Thử lấy picture qua UID thật (không phải PSID)
        const picRes = await fetch(
          `https://graph.facebook.com/v25.0/${uid}/picture?type=large&redirect=false&access_token=${token}`
        );
        if (picRes.ok) {
          const picData = await picRes.json();
          if (picData.data?.url && !picData.data?.is_silhouette) {
            avatarUrl = picData.data.url;
          }
        }
      } catch (e) {
        console.warn('[MANUAL_PROFILE] Could not fetch avatar from UID:', e);
      }
    }

    // Cập nhật DB: lưu profile URL thủ công, UID thật nếu trích xuất được, và avatar nếu lấy được
    await pool.query(
      `UPDATE fb_conversations
       SET manual_profile_url = $1,
           facebook_uid = $3
           ${avatarUrl ? ', customer_avatar = $4, avatar_url = $4' : ''}
       WHERE id = $2`,
      avatarUrl ? [profile_url, id, uid, avatarUrl] : [profile_url, id, uid]
    );

    res.json({
      success: true,
      manual_profile_url: profile_url,
      facebook_uid: uid,
      avatar_url: avatarUrl,
      uid_extracted: uid,
      uid_source: uidSource,
      business_id: businessIdFromUrl,
      asset_id: assetIdFromUrl,
      mailbox_id: mailboxIdFromUrl,
      business_id_updated: Boolean(businessIdFromUrl && (mailboxIdFromUrl || assetIdFromUrl || currentPageId))
    });
  } catch (err: any) {
    console.error('Error saving manual profile:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id/ad-sources', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM fb_conversation_ad_sources
       WHERE conversation_id = $1
       ORDER BY last_seen_at DESC, first_seen_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Error fetching ad sources:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── SAVE CUSTOMER NOTE (Legacy & Multi-note support) ───

router.get('/conversations/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM fb_conversation_notes WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(rows.map(row => ({
      id: row.id,
      conversation_id: row.conversation_id,
      note_text: row.note_text,
      author_name: row.author_name,
      author_email: row.author_email,
      created_at: row.created_at
    })));
  } catch (err: any) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, author_name, author_email } = req.body;

    if (!note) return res.status(400).json({ error: 'Note text is required' });

    const { rows } = await pool.query(
      'INSERT INTO fb_conversation_notes (conversation_id, note_text, author_name, author_email) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, note, author_name || null, author_email || null]
    );

    // Also update the summary note in fb_conversations for compatibility
    await pool.query('UPDATE fb_conversations SET customer_note = $1 WHERE id = $2', [note, id]);

    res.json({
      success: true,
      note: {
        id: rows[0].id,
        conversation_id: rows[0].conversation_id,
        note_text: rows[0].note_text,
        author_name: rows[0].author_name,
        author_email: rows[0].author_email,
        created_at: rows[0].created_at
      }
    });
  } catch (err: any) {
    console.error('Error saving note:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/note', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    // Save to multi-note table as well
    await pool.query(
      'INSERT INTO fb_conversation_notes (conversation_id, note_text, author_name) VALUES ($1, $2, $3)',
      [id, note, 'Hệ thống']
    );

    await pool.query('UPDATE fb_conversations SET customer_note = $1 WHERE id = $2', [note || null, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/refresh-profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: convs } = await pool.query(
      `SELECT c.customer_id, p.access_token, p.page_id 
       FROM fb_conversations c 
       JOIN fb_pages p ON c.page_id = p.page_id 
       WHERE c.id = $1`, [id]
    );

    if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    const { customer_id, access_token, page_id } = convs[0];

    let name = 'Khách hàng FB';
    let avatar: string | null = null;

    // Method 1: Get name from conversations/participants (most reliable)
    try {
      const convSearchRes = await fetch(
        `https://graph.facebook.com/v25.0/${page_id}/conversations?user_id=${customer_id}&fields=participants&access_token=${access_token}`
      );
      const convSearchData = await convSearchRes.json();
      console.log(`[REFRESH_PROFILE] Method 1 result for ${customer_id}:`, JSON.stringify(convSearchData).substring(0, 200));

      if (convSearchData.data && convSearchData.data.length > 0) {
        const participants = convSearchData.data[0].participants?.data || [];
        const userParticipant = participants.find((p: any) => p.id === customer_id);
        if (userParticipant?.name) name = userParticipant.name;
      }
    } catch (e) { console.error('participants fetch error', e); }

    // Method 2: Try direct profile for avatar
    try {
      const profileRes = await fetch(
        `https://graph.facebook.com/v25.0/${customer_id}?fields=name,profile_pic&access_token=${access_token}`
      );
      const profileData = await profileRes.json();
      console.log(`[REFRESH_PROFILE] Method 2 result for ${customer_id}:`, JSON.stringify(profileData));

      if (profileData.name && name === 'Khách hàng FB') name = profileData.name;
      if (profileData.profile_pic) {
        avatar = `/api/fb/avatar-proxy?url=${encodeURIComponent(profileData.profile_pic)}`;
      }
    } catch (e) { /* fallback, no avatar */ }

    // Method 3: Get picture via conversation senders/participants email
    if (!avatar) {
      try {
        const convRes = await fetch(
          `https://graph.facebook.com/v25.0/${page_id}/conversations?user_id=${customer_id}&fields=senders,participants&access_token=${access_token}`
        );
        const convData = await convRes.json();
        if (convData.data && convData.data.length > 0) {
          const senders = convData.data[0].senders?.data || convData.data[0].participants?.data || [];
          const user = senders.find((s: any) => s.id === customer_id);
          if (user?.picture?.data?.url) {
            avatar = `/api/fb/avatar-proxy?url=${encodeURIComponent(user.picture.data.url)}`;
          }
          // Try with picture field specifically
          const convId = convData.data[0].id;
          const detailRes = await fetch(
            `https://graph.facebook.com/v25.0/${convId}?fields=participants.fields(name,picture,profile_pic)&access_token=${access_token}`
          );
          const detailData = await detailRes.json();
          const userDetail = (detailData.participants?.data || []).find((p: any) => p.id === customer_id);
          const rawUrl = userDetail?.picture?.data?.url || userDetail?.profile_pic;
          if (rawUrl) {
            avatar = `/api/fb/avatar-proxy?url=${encodeURIComponent(rawUrl)}`;
          }
        }
      } catch (e) { /* no avatar via conv */ }
    }

    await pool.query(
      'UPDATE fb_conversations SET customer_name = $1, customer_avatar = $2 WHERE id = $3',
      [name, avatar, id]
    );

    res.json({
      success: true,
      customer_name: name,
      customer_avatar: avatar,
      profile_link: `https://business.facebook.com/latest/people/${customer_id}?asset_id=${page_id}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ─── IMAGE LIBRARY & IMAGE REPLY ───

router.get('/image-library', async (req, res) => {
  try {
    const pageId = (req.query.page_id as string) || null;
    const search = ((req.query.search as string) || '').trim();
    const params: any[] = [];
    const conditions: string[] = [];

    if (pageId) {
      params.push(pageId);
      conditions.push(`(page_id = $${params.length} OR page_id IS NULL)`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(title) LIKE $${params.length} OR LOWER(COALESCE(description, '')) LIKE $${params.length} OR LOWER(COALESCE(category, '')) LIKE $${params.length})`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT * FROM fb_image_library ${whereSql} ORDER BY updated_at DESC, created_at DESC LIMIT 100`,
      params
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/image-library', async (req, res) => {
  try {
    const { page_id, title, description, image_url, tags, category, created_by } = req.body;
    if (!title || !image_url) return res.status(400).json({ error: 'title and image_url are required' });

    const { rows } = await pool.query(
      `INSERT INTO fb_image_library (page_id, title, description, image_url, tags, category, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [page_id || null, title, description || null, image_url, JSON.stringify(Array.isArray(tags) ? tags : []), category || null, created_by || null]
    );
    res.json({ success: true, image: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/image-library/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fb_image_library WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/messages/send-image', async (req, res) => {
  try {
    const { conversation_id, image_url, library_image_id, sender_name, sender_email } = req.body;
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id is required' });
    const senderName = typeof sender_name === 'string' && sender_name.trim() ? sender_name.trim() : null;
    const senderEmail = typeof sender_email === 'string' && sender_email.trim() ? sender_email.trim() : null;

    const { rows: convs } = await pool.query('SELECT page_id, customer_id FROM fb_conversations WHERE id = $1', [conversation_id]);
    if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    const conv = convs[0];

    let finalImageUrl = image_url;
    if (!finalImageUrl && library_image_id) {
      const { rows: images } = await pool.query(
        'SELECT image_url FROM fb_image_library WHERE id = $1 AND (page_id = $2 OR page_id IS NULL)',
        [library_image_id, conv.page_id]
      );
      finalImageUrl = images[0]?.image_url;
    }
    if (!finalImageUrl) return res.status(400).json({ error: 'image_url or library_image_id is required' });

    const { rows: pages } = await pool.query('SELECT access_token FROM fb_pages WHERE page_id = $1', [conv.page_id]);
    if (pages.length === 0) return res.status(404).json({ error: 'Page not found' });

    await sendFacebookImage(pages[0].access_token, conv.customer_id, finalImageUrl);

    const { rows: msgRows } = await pool.query(
      `INSERT INTO fb_messages (conversation_id, sender_type, sender_name, sender_email, message_text, attachment_type, attachment_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [conversation_id, 'human', senderName, senderEmail, '[Ảnh]', 'image', finalImageUrl]
    );

    await pool.query(
      `UPDATE fb_conversations SET is_human_intervened = true, last_message = $1, last_message_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['[Ảnh]', conversation_id]
    );

    res.json({ success: true, message: mapMessageRow(msgRows[0]) });
  } catch (err: any) {
    console.error('Error sending image:', err);
    res.status(err.details ? 502 : 500).json({ error: err.message, details: err.details });
  }
});

// ─── HUMAN REPLY ───

router.post('/messages/send', async (req, res) => {
  try {
    const { conversation_id, text, sender_name, sender_email } = req.body;
    const senderName = typeof sender_name === 'string' && sender_name.trim() ? sender_name.trim() : null;
    const senderEmail = typeof sender_email === 'string' && sender_email.trim() ? sender_email.trim() : null;

    // Get conversation info
    const { rows: convs } = await pool.query('SELECT page_id, customer_id FROM fb_conversations WHERE id = $1', [conversation_id]);
    if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    const conv = convs[0];

    // Get page info
    const { rows: pages } = await pool.query('SELECT access_token FROM fb_pages WHERE page_id = $1', [conv.page_id]);
    if (pages.length === 0) return res.status(404).json({ error: 'Page not found' });
    const page = pages[0];

    // Send via FB Graph API
    console.log(`[FB_SEND] Sending human reply to ${conv.customer_id} via page ${conv.page_id}`);
    const fbSendRes = await fetch(`https://graph.facebook.com/v25.0/me/messages?access_token=${page.access_token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: { id: conv.customer_id },
        message: {
          text,
          metadata: 'SENT_BY_HUMAN'
        }
      })
    });
    const fbSendData = await fbSendRes.json();
    console.log('FB Human Send Response:', JSON.stringify(fbSendData));

    if (!fbSendRes.ok || fbSendData.error) {
      console.error('[FB_HUMAN_SEND_ERROR]', JSON.stringify(fbSendData));
      return res.status(502).json({
        error: fbSendData.error?.message || 'Facebook did not accept the message',
        details: fbSendData.error || fbSendData
      });
    }

    // Save Message and Intervene
    const { rows: msgRows } = await pool.query(
      `INSERT INTO fb_messages (conversation_id, sender_type, sender_name, sender_email, message_text) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [conversation_id, 'human', senderName, senderEmail, text]
    );

    await pool.query(
      `UPDATE fb_conversations SET is_human_intervened = true, last_message = $1, last_message_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [text, conversation_id]
    );

    res.json({ success: true, message: mapMessageRow(msgRows[0]) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
