import express from 'express';
import { pool } from './db';

const router = express.Router();

// Avatar Proxy to bypass Facebook hotlinking/CORS restrictions for profile/ad images.
router.get('/avatar-proxy', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.warn(`[AVATAR_PROXY] Fetch failed: ${response.status} for ${url}`);
      return res.status(response.status).json({ error: `Failed to fetch image: ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[AVATAR_PROXY_ERROR]', err);
    res.status(500).json({ error: 'Error proxying image', message: err.message });
  }
});

const GRAPH_API_VERSION = 'v25.0';

const normalizeConversation = (row: any) => ({
  ...row,
  avatarUrl: row.avatar_url || row.customer_avatar || null,
  customer_avatar: row.customer_avatar || row.avatar_url || null,
});

async function fetchCustomerProfile(psid: string, accessToken: string) {
  let customer_name = 'Khách hàng FB';
  let avatarUrl = null;
  let profile_link = null;

  const fields = 'name,first_name,last_name,profile_pic,link';
  const profileRes = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${psid}?fields=${fields}&access_token=${accessToken}`
  );
  const profileData: any = await profileRes.json();

  if (profileData.error) {
    throw profileData.error;
  }

  if (profileData.name) {
    customer_name = profileData.name;
  } else if (profileData.first_name || profileData.last_name) {
    customer_name = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ');
  }

  if (profileData.profile_pic) {
    avatarUrl = profileData.profile_pic;
  }

  profile_link = profileData.link || `https://www.facebook.com/${psid}`;

  return { customer_name, avatarUrl, customer_avatar: avatarUrl, profile_link, raw: profileData };
}

// ─── FB PAGES ───

router.get('/pages', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, page_id, page_name, is_active, dify_api_key FROM fb_pages ORDER BY created_at DESC');
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

// Receive Messages
router.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      const page_id = entry.id;
      const webhook_event = entry.messaging[0];
      console.log('Webhook Event:', webhook_event);
      
      const sender_psid = webhook_event.sender.id;
      
      // Look up page to get Dify key and access token
      const { rows: pages } = await pool.query('SELECT * FROM fb_pages WHERE page_id = $1', [page_id]);
      if (pages.length === 0) continue;
      const page = pages[0];

      if (webhook_event.message) {
        const message = webhook_event.message;
        const messageText = message.text;
        if (!messageText) continue;

          // --- HANDLE ECHOES (Messages sent by Page) ---
        if (message.is_echo) {
          console.log('[ECHO] Message sent by Page:', messageText);
          
          // Check if message was sent by our AI using metadata or app_id
          const isFromAI = (message.metadata === 'SENT_BY_AI') || 
                           (message.app_id && process.env.FB_APP_ID && message.app_id.toString() === process.env.FB_APP_ID);
          
          console.log(`[ECHO] isFromAI: ${isFromAI} (metadata: ${message.metadata}, app_id: ${message.app_id})`);

          await pool.query(
            `UPDATE fb_conversations SET 
             last_message = $1, 
             last_message_at = CURRENT_TIMESTAMP,
             is_human_intervened = $2
             WHERE page_id = $3 AND customer_id = $4`,
            [messageText, !isFromAI, page_id, sender_psid]
          );

          // Save to messages table ONLY if not already saved (to avoid duplicates)
          const { rows: convs } = await pool.query('SELECT id FROM fb_conversations WHERE page_id = $1 AND customer_id = $2', [page_id, sender_psid]);
          if (convs.length > 0) {
            const convId = convs[0].id;
            // Check if this message text was recently saved (within 5 seconds) to avoid duplicates from echoes
            const { rows: recentMsgs } = await pool.query(
              `SELECT id FROM fb_messages 
               WHERE conversation_id = $1 
               AND message_text = $2 
               AND created_at > NOW() - INTERVAL '5 seconds'
               LIMIT 1`,
              [convId, messageText]
            );

            if (recentMsgs.length === 0) {
              await pool.query(
                `INSERT INTO fb_messages (conversation_id, sender_type, message_text) VALUES ($1, $2, $3)`,
                [convId, isFromAI ? 'ai' : 'human', messageText]
              );
              console.log(`[ECHO] Saved new ${isFromAI ? 'AI' : 'human'} message to DB`);
            } else {
              console.log(`[ECHO] Message already exists in DB, skipping duplicate save`);
            }
          }
          continue; // End processing for this echo event
        }

        // --- NORMAL USER MESSAGE ---
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

        // --- FETCH CUSTOMER PROFILE ---
        let customer_name = 'Khách hàng FB';
        let avatarUrl = null;
        let customer_avatar = null;
        let profile_link = null;
        
        try {
          const profile = await fetchCustomerProfile(sender_psid, page.access_token);
          console.log(`[FB_PROFILE] Data for ${sender_psid}:`, JSON.stringify(profile.raw));
          customer_name = profile.customer_name;
          avatarUrl = profile.avatarUrl;
          customer_avatar = profile.customer_avatar;
          profile_link = profile.profile_link;
        } catch (err) {
          console.error(`[FB_PROFILE_ERROR] ${sender_psid}:`, err);
        }

        // Upsert Conversation
        let dify_conversation_id = null;
        let is_human_intervened = false;

        const { rows: convs } = await pool.query(
          `INSERT INTO fb_conversations (page_id, customer_id, customer_name, customer_avatar, avatar_url, last_message, unread_count, assigned_to, profile_link)
           VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8)
           ON CONFLICT (page_id, customer_id) DO UPDATE SET
           customer_name = COALESCE(EXCLUDED.customer_name, fb_conversations.customer_name),
           customer_avatar = COALESCE(EXCLUDED.customer_avatar, fb_conversations.customer_avatar),
           avatar_url = COALESCE(EXCLUDED.avatar_url, fb_conversations.avatar_url, fb_conversations.customer_avatar),
           profile_link = COALESCE(EXCLUDED.profile_link, fb_conversations.profile_link),
           last_message = EXCLUDED.last_message, 
           last_message_at = CURRENT_TIMESTAMP, 
           unread_count = fb_conversations.unread_count + 1, 
           assigned_to = COALESCE(fb_conversations.assigned_to, EXCLUDED.assigned_to)
           RETURNING id, dify_conversation_id, is_human_intervened`,
          [page_id, sender_psid, customer_name, customer_avatar, avatarUrl, messageText, assigned_to, profile_link]
        );

        const convId = convs[0].id;
        dify_conversation_id = convs[0].dify_conversation_id;
        is_human_intervened = convs[0].is_human_intervened;

        // Insert Message
        await pool.query(
          `INSERT INTO fb_messages (conversation_id, sender_type, message_text) VALUES ($1, $2, $3)`,
          [convId, 'user', messageText]
        );

        // Forward to Dify if not human intervened
        if (!is_human_intervened && page.dify_api_key) {
          try {
            const difyRes = await fetch('https://dify.movads.vn/v1/chat-messages', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${page.dify_api_key}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                inputs: {},
                query: messageText,
                response_mode: 'blocking',
                conversation_id: dify_conversation_id || '',
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

              // Update conversation_id
              await pool.query(
                `UPDATE fb_conversations SET dify_conversation_id = $1, last_message = $2, last_message_at = CURRENT_TIMESTAMP WHERE id = $3`,
                [newDifyConvId, aiReply, convId]
              );

              // Send back to FB with metadata
              await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${page_id}/messages?access_token=${page.access_token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: sender_psid },
                  message: { 
                    text: aiReply,
                    metadata: 'SENT_BY_AI' 
                  }
                })
              });
              console.log(`[AI_REPLY] Sent to FB for customer ${sender_psid}`);
            } else {
              console.warn(`[Dify] No answer in response for ${sender_psid}:`, difyData);
            }
          } catch (err) {
            console.error('Dify API Error:', err);
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// ─── FETCH CONVERSATIONS & MESSAGES ───

router.get('/conversations', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM fb_conversations ORDER BY last_message_at DESC');
    res.json(rows.map(normalizeConversation));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM fb_messages WHERE conversation_id = $1 ORDER BY created_at ASC', [id]);
    res.json(rows);
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

router.get('/conversations/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, conversation_id, note_text, author_name, author_email, created_at
       FROM fb_conversation_notes
       WHERE conversation_id = $1
       ORDER BY created_at ASC, id ASC`,
      [id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, author_name, author_email } = req.body;
    const noteText = typeof note === 'string' ? note.trim() : '';

    if (!noteText) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO fb_conversation_notes (conversation_id, note_text, author_name, author_email)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id, note_text, author_name, author_email, created_at`,
      [id, noteText, author_name || 'Người dùng', author_email || null]
    );

    res.json({ success: true, note: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/note', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, author_name, author_email } = req.body;
    const noteText = typeof note === 'string' ? note.trim() : '';

    if (!noteText) {
      return res.json({ success: true });
    }

    const { rows } = await pool.query(
      `INSERT INTO fb_conversation_notes (conversation_id, note_text, author_name, author_email)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id, note_text, author_name, author_email, created_at`,
      [id, noteText, author_name || 'Người dùng', author_email || null]
    );

    res.json({ success: true, note: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:id/refresh-profile', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get conversation info
    const { rows: convs } = await pool.query('SELECT page_id, customer_id FROM fb_conversations WHERE id = $1', [id]);
    if (convs.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    const conv = convs[0];

    // Get page info
    const { rows: pages } = await pool.query('SELECT access_token FROM fb_pages WHERE page_id = $1', [conv.page_id]);
    if (pages.length === 0) return res.status(404).json({ error: 'Page not found' });
    const page = pages[0];

    // Fetch from FB - using standard Messenger fields and v25.0
    const profile = await fetchCustomerProfile(conv.customer_id, page.access_token);
    const profileData: any = profile.raw;
    
    console.log(`[FB_PROFILE_REFRESH] Data for ${conv.customer_id}:`, JSON.stringify(profileData));

    if (profileData.error) {
      console.error(`[FB_PROFILE_REFRESH_ERROR] ${conv.customer_id}:`, profileData.error);
      return res.status(400).json({ error: profileData.error.message });
    }

    let customer_name = profileData.name || 'Khách hàng FB';
    if (!profileData.name && (profileData.first_name || profileData.last_name)) {
      customer_name = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ');
    }

    const avatarUrl = profile.avatarUrl;
    const customer_avatar = profile.customer_avatar;
    const profile_link = profile.profile_link;

    // Update DB
    await pool.query(
      `UPDATE fb_conversations SET customer_name = $1, customer_avatar = $2, avatar_url = $3, profile_link = $4 WHERE id = $5`,
      [customer_name, customer_avatar, avatarUrl, profile_link, id]
    );

    res.json({ success: true, customer_name, avatarUrl, customer_avatar, profile_link });
  } catch (err: any) {
    const message = err?.message || err?.error_user_msg || 'Failed to refresh Facebook profile';
    res.status(err?.code ? 400 : 500).json({ error: message });
  }
});

// Support both PUT and POST for compatibility
router.all('/conversations/:id/toggle-bot', async (req, res) => {
  if (req.method !== 'PUT' && req.method !== 'POST') return res.sendStatus(405);
  
  try {
    const { id } = req.params;
    const { is_human_intervened } = req.body;
    console.log(`[BOT_TOGGLE] Request: id=${id}, state=${is_human_intervened}, method=${req.method}`);
    
    if (is_human_intervened === undefined) {
      return res.status(400).json({ error: 'is_human_intervened is required' });
    }

    const result = await pool.query('UPDATE fb_conversations SET is_human_intervened = $1 WHERE id = $2', [is_human_intervened, id]);
    console.log(`[BOT_TOGGLE] DB Update Result: ${result.rowCount} rows updated`);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error(`[BOT_TOGGLE_ERROR]`, err);
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

    // Send via FB Graph API with metadata
    await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${conv.page_id}/messages?access_token=${page.access_token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: conv.customer_id },
        message: { 
          text,
          metadata: 'SENT_BY_HUMAN'
        }
      })
    });

    // Save Message and Intervene
    await pool.query(
      `INSERT INTO fb_messages (conversation_id, sender_type, message_text) VALUES ($1, $2, $3)`,
      [conversation_id, 'human', text]
    );

    await pool.query(
      `UPDATE fb_conversations SET is_human_intervened = true, last_message = $1, last_message_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [text, conversation_id]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
