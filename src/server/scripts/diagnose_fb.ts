import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function testAvatarMethods() {
  const { rows: pages } = await pool.query('SELECT access_token, page_id FROM fb_pages LIMIT 1');
  const token = pages[0].access_token;
  const pageId = pages[0].page_id;
  const psid = '26508968658745629';

  console.log('\n=== Test: Conversation detail with participant picture ===');
  // First get the conversation ID
  const convRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}/conversations?user_id=${psid}&fields=participants&access_token=${token}`);
  const convData = await convRes.json();
  const convId = convData.data?.[0]?.id;
  console.log('Conv ID:', convId);

  if (convId) {
    // Try fetching participants with picture field
    const fields = [
      'participants.fields(name,picture)',
      'participants.fields(name,pic)',
      'participants.fields(name,picture.width(500).height(500))',
      'senders.fields(name,picture)',
    ];

    for (const field of fields) {
      const r = await fetch(`https://graph.facebook.com/v25.0/${convId}?fields=${field}&access_token=${token}`);
      const d = await r.json();
      console.log(`\n--- field: ${field} ---`);
      const participants = d.participants?.data || d.senders?.data || [];
      const user = participants.find((p: any) => p.id === psid);
      if (user) {
        console.log('User data:', JSON.stringify(user));
      } else {
        console.log('Error:', d.error?.message || 'no user found in participants');
      }
    }
  }
  
  process.exit(0);
}

testAvatarMethods().catch(err => { console.error(err); process.exit(1); });
