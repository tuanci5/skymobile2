import express from 'express';
import { pool } from './db';

const router = express.Router();

// Avatar Proxy to bypass Facebook hotlinking restrictions
router.get('/avatar-proxy', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn(`Avatar fetch failed: ${response.status} for ${url}`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).json({ 
        error: `Failed to fetch avatar: ${response.status}`,
        url: url 
      });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Avatar proxy error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Error proxying avatar',
      message: err.message 
    });
  }
});

// ─── FB PAGES ───

router.get('/pages', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, page_id, page_name, is_active, dify_api_key, distribution_mode FROM fb_pages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pages', async (req, res) => {
  try {
    const { page_id, page_name, access_token, dify_api_key } = req.body;
    await pool.query(
      `INSERT INTO fb_pages (page_id, page_name, access_token, dify_api_key) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (page_id) DO UPDATE SET 
       page_name = EXCLUDED.page_name, access_token = EXCLUDED.access_token, dify_api_key = EXCLUDED.dify_api_key`,
      [page_id, page_name, access_token, dify_api_key]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/pages/:page_id', async (req, res) => {
  try {
    const { page_id } = req.params;
    const { access_token, dify_api_key } = req.body;
    await pool.query(
      'UPDATE fb_pages SET access_token = $1, dify_api_key = $2 WHERE page_id = $3',
      [access_token, dify_api_key, page_id]
    );
    res.json({ success: true });
  } catch (err: any) {
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
  // console.log(JSON.stringify(req.body, null, 2)); // Giảm log rác
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
          console.log('Webhook Event:', JSON.stringify(webhook_event));

          // 3. KIỂM TRA TRÙNG LẶP (DEDUPLICATION)
          if (webhook_event.message && webhook_event.message.mid) {
            const mid = webhook_event.message.mid;
            if (processedMessageIds.has(mid)) {
              console.log(`[DEDUPE] Bỏ qua tin nhắn trùng lặp (mid): ${mid}`);
              continue;
            }
            processedMessageIds.add(mid);
            // Xóa khỏi cache sau 5 phút để tránh tràn bộ nhớ
            setTimeout(() => processedMessageIds.delete(mid), 5 * 60 * 1000);
          }

          const sender_psid = webhook_event.sender.id;

      // Look up page to get Dify key and access token
      const { rows: pages } = await pool.query('SELECT * FROM fb_pages WHERE page_id = $1', [page_id]);
      if (pages.length === 0) continue;
      const page = pages[0];

      if (webhook_event.message) {
        const messageText = webhook_event.message.text;
        if (!messageText) continue;

        // --- AD TRACKING LOGIC ---
        let ad_id = webhook_event.message.referral?.ad_id || webhook_event.referral?.ad_id || null;
        let campaign_name = null;
        let ad_image = null;
        let ad_message = null;

        if (ad_id) {
          try {
            console.log(`[AD_TRACK] Fetching details for ad_id: ${ad_id}`);
            const adRes = await fetch(`https://graph.facebook.com/v25.0/${ad_id}?fields=adset{campaign{name}},creative{effective_object_id}&access_token=${page.access_token}`);
            const adData = await adRes.json();

            campaign_name = adData.adset?.campaign?.name || null;
            const postId = adData.creative?.effective_object_id;

            if (postId) {
              const postRes = await fetch(`https://graph.facebook.com/v25.0/${postId}?fields=full_picture,message&access_token=${page.access_token}`);
              const postData = await postRes.json();
              if (postData.full_picture) {
                ad_image = `http://localhost:3001/api/fb/avatar-proxy?url=${encodeURIComponent(postData.full_picture)}`;
              }
              ad_message = postData.message || null;
              console.log(`[AD_TRACK] Got Ad Post: ${postId}, has_image: ${!!ad_image}`);
            }
          } catch (err) {
            console.error('Error fetching Ad details:', err);
          }
        }

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
            if (profileData.name && customer_name === 'Khách hàng FB') customer_name = profileData.name;
            if (profileData.profile_pic) customer_avatar = profileData.profile_pic;
          }

          // Method 3: Final Fallback - Direct Graph Picture URL via Proxy
          if (!customer_avatar) {
            const directUrl = `https://graph.facebook.com/v25.0/${sender_psid}/picture?type=large&access_token=${page.access_token}`;
            customer_avatar = `http://localhost:3001/api/fb/avatar-proxy?url=${encodeURIComponent(directUrl)}`;
          }

          console.log(`[PROFILE] Final: name=${customer_name}, has_avatar=${!!customer_avatar}`);
        } catch (err) {
          console.error('Error fetching FB profile:', err);
        }

        // Upsert Conversation
        let dify_conversation_id = null;
        let is_human_intervened = false;

        const { rows: convs } = await pool.query(
          `INSERT INTO fb_conversations (page_id, customer_id, customer_name, customer_avatar, last_message, unread_count, assigned_to, ad_id, campaign_name, ad_image, ad_message)
           VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, $10)
           ON CONFLICT (page_id, customer_id) DO UPDATE SET
           customer_name = CASE WHEN fb_conversations.customer_name = 'Khách hàng FB' OR fb_conversations.customer_name IS NULL THEN EXCLUDED.customer_name ELSE fb_conversations.customer_name END,
           customer_avatar = COALESCE(EXCLUDED.customer_avatar, fb_conversations.customer_avatar),
           last_message = EXCLUDED.last_message, 
           last_message_at = CURRENT_TIMESTAMP, 
           unread_count = fb_conversations.unread_count + 1, 
           assigned_to = COALESCE(fb_conversations.assigned_to, EXCLUDED.assigned_to),
           ad_id = COALESCE(EXCLUDED.ad_id, fb_conversations.ad_id),
           campaign_name = COALESCE(EXCLUDED.campaign_name, fb_conversations.campaign_name),
           ad_image = COALESCE(EXCLUDED.ad_image, fb_conversations.ad_image),
           ad_message = COALESCE(EXCLUDED.ad_message, fb_conversations.ad_message)
           RETURNING id, dify_conversation_id, is_human_intervened`,
          [page_id, sender_psid, customer_name, customer_avatar, messageText, assigned_to, ad_id, campaign_name, ad_image, ad_message]
        );

        const convId = convs[0].id;
        dify_conversation_id = convs[0].dify_conversation_id;
        is_human_intervened = convs[0].is_human_intervened;

        // Insert Message
        await pool.query(
          `INSERT INTO fb_messages (conversation_id, sender_type, message_text) VALUES ($1, $2, $3)`,
          [convId, 'user', messageText]
        );

        // --- DIFY AI BATCHING LOGIC (5s delay to group messages) ---
        if (!is_human_intervened && page.dify_api_key) {
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

                // Save AI Message
                await pool.query(
                  `INSERT INTO fb_messages (conversation_id, sender_type, message_text) VALUES ($1, $2, $3)`,
                  [convId, 'ai', aiReply]
                );

                // Update conversation_id and last message
                await pool.query(
                  `UPDATE fb_conversations SET dify_conversation_id = $1, last_message = $2, last_message_at = CURRENT_TIMESTAMP WHERE id = $3`,
                  [newDifyConvId, aiReply, convId]
                );

                // Send back to FB
                const fbSendRes = await fetch(`https://graph.facebook.com/v25.0/${page_id}/messages?access_token=${page.access_token}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: sender_psid },
                    message: { text: aiReply }
                  })
                });
                const fbSendData = await fbSendRes.json();
                console.log('FB AI Send Response (Batched):', JSON.stringify(fbSendData));
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
    const { rows } = await pool.query('SELECT * FROM fb_conversations ORDER BY last_message_at DESC');
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
    res.json(rows.reverse());
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
      if (profileData.name && name === 'Khách hàng FB') name = profileData.name;
      if (profileData.profile_pic) avatar = profileData.profile_pic;
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
          if (user?.picture?.data?.url) avatar = user.picture.data.url;
          // Try with picture field specifically
          const convId = convData.data[0].id;
          const detailRes = await fetch(
            `https://graph.facebook.com/v25.0/${convId}?fields=participants.fields(name,picture,profile_pic)&access_token=${access_token}`
          );
          const detailData = await detailRes.json();
          const userDetail = (detailData.participants?.data || []).find((p: any) => p.id === customer_id);
          if (userDetail?.picture?.data?.url) avatar = userDetail.picture.data.url;
          if (userDetail?.profile_pic) avatar = userDetail.profile_pic;
        }
      } catch (e) { /* no avatar via conv */ }
    }

    // Method 4: Final Fallback - Direct Graph Picture URL via Proxy
    if (!avatar) {
      const directUrl = `https://graph.facebook.com/v25.0/${customer_id}/picture?type=large&access_token=${access_token}`;
      avatar = `http://localhost:3001/api/fb/avatar-proxy?url=${encodeURIComponent(directUrl)}`;
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
    const fbSendRes = await fetch(`https://graph.facebook.com/v25.0/${conv.page_id}/messages?access_token=${page.access_token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: conv.customer_id },
        message: { text }
      })
    });
    const fbSendData = await fbSendRes.json();
    console.log('FB Human Send Response:', JSON.stringify(fbSendData));

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
