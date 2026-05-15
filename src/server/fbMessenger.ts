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
const getFirstImageAttachment = (message: any) => {
  const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
  return attachments.find((attachment: any) => attachment?.type === 'image' && attachment?.payload?.url) || null;
};

const buildAttachmentProxyUrl = (messageId: number, attachmentType?: string | null) => (
  attachmentType === 'image' ? `/api/fb/message-attachment-proxy/${messageId}` : null
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
    const { rows } = await pool.query('SELECT id, page_id, page_name, is_active, dify_api_key, facebook_ad_account_id, business_id, distribution_mode, assigned_users, ai_reply_delay, ai_start_hour, ai_end_hour FROM fb_pages ORDER BY created_at DESC');
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
    const { access_token, dify_api_key, facebook_ad_account_id, business_id, ai_reply_delay, ai_start_hour, ai_end_hour } = req.body;
    
    if (access_token && access_token.trim() !== '') {
      await pool.query(
        'UPDATE fb_pages SET access_token = $1, dify_api_key = $2, facebook_ad_account_id = $3, business_id = $4, ai_reply_delay = $5, ai_start_hour = $6, ai_end_hour = $7 WHERE page_id = $8',
        [
          access_token, 
          dify_api_key,
          facebook_ad_account_id || null,
          business_id || null,
          ai_reply_delay !== undefined ? ai_reply_delay : 5, 
          ai_start_hour !== undefined ? ai_start_hour : 0, 
          ai_end_hour !== undefined ? ai_end_hour : 24, 
          page_id
        ]
      );
    } else {
      await pool.query(
        'UPDATE fb_pages SET dify_api_key = $1, facebook_ad_account_id = $2, business_id = $3, ai_reply_delay = $4, ai_start_hour = $5, ai_end_hour = $6 WHERE page_id = $7',
        [
          dify_api_key,
          facebook_ad_account_id || null,
          business_id || null,
          ai_reply_delay !== undefined ? ai_reply_delay : 5, 
          ai_start_hour !== undefined ? ai_start_hour : 0, 
          ai_end_hour !== undefined ? ai_end_hour : 24, 
          page_id
        ]
      );
    }
    
    res.json({ success: true });
  } catch (err: any) {
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
    
    await pool.query(
      `UPDATE fb_pages SET assigned_users = $1::jsonb WHERE page_id = $2`,
      [JSON.stringify(assigned_users || []), id]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error assigning users to page:', err);
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

            const imageAttachment = getFirstImageAttachment(webhook_event.message);
            const messageText = webhook_event.message.text || (imageAttachment ? '[Ảnh]' : '');
            if (!messageText && !imageAttachment) continue;
            const attachmentType = imageAttachment ? 'image' : null;
            const attachmentUrl = imageAttachment?.payload?.url || null;
            const facebookAttachmentId = imageAttachment?.payload?.attachment_id || null;

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
            [convId, 'user', messageText, attachmentType, attachmentUrl, imageAttachment ? JSON.stringify(imageAttachment.payload || {}) : null, facebookAttachmentId]
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

router.get('/conversations', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, p.page_name, p.business_id
      FROM fb_conversations c
      LEFT JOIN fb_pages p ON p.page_id = c.page_id
      ORDER BY c.last_message_at DESC
    `);
    res.json(rows);
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

    if (rows.length === 0 || rows[0].attachment_type !== 'image' || !rows[0].attachment_url) {
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
    // Dạng: business.facebook.com/latest/inbox/all?...selected_item_id=UID&business_id=...&asset_id=...&mailbox_id=...
    try {
      const parsedUrl = new URL(profile_url.startsWith('http') ? profile_url : `https://${profile_url}`);
      const host = parsedUrl.hostname.replace(/^www\./, '').replace(/^m\./, '');
      const selectedItemId = parsedUrl.searchParams.get('selected_item_id');
      const businessId = parsedUrl.searchParams.get('business_id');
      const mailboxId = parsedUrl.searchParams.get('mailbox_id');
      const assetId = parsedUrl.searchParams.get('asset_id');

      if (host === 'business.facebook.com') {
        if (selectedItemId && /^\d+$/.test(selectedItemId)) {
          uid = selectedItemId;
          uidSource = 'business_suite_selected_item_id';
        }
        if (businessId && /^\d+$/.test(businessId)) businessIdFromUrl = businessId;
        if (mailboxId && /^\d+$/.test(mailboxId)) mailboxIdFromUrl = mailboxId;
        if (assetId && /^\d+$/.test(assetId)) assetIdFromUrl = assetId;
      }
    } catch (e) {
      const selectedMatch = profile_url.match(/[?&]selected_item_id=(\d+)/);
      const businessMatch = profile_url.match(/[?&]business_id=(\d+)/);
      const mailboxMatch = profile_url.match(/[?&]mailbox_id=(\d+)/);
      const assetMatch = profile_url.match(/[?&]asset_id=(\d+)/);
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
    const { conversation_id, image_url, library_image_id } = req.body;
    if (!conversation_id) return res.status(400).json({ error: 'conversation_id is required' });

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
      `INSERT INTO fb_messages (conversation_id, sender_type, message_text, attachment_type, attachment_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [conversation_id, 'human', '[Ảnh]', 'image', finalImageUrl]
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
    const { conversation_id, text } = req.body;

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
      `INSERT INTO fb_messages (conversation_id, sender_type, message_text) VALUES ($1, $2, $3) RETURNING *`,
      [conversation_id, 'human', text]
    );

    await pool.query(
      `UPDATE fb_conversations SET is_human_intervened = true, last_message = $1, last_message_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [text, conversation_id]
    );

    res.json({ success: true, message: msgRows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
