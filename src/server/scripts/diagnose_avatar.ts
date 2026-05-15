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

async function deepDiagnoseAvatar() {
  const { rows: pages } = await pool.query('SELECT access_token, page_id FROM fb_pages LIMIT 1');
  const token = pages[0].access_token;
  const pageId = pages[0].page_id;
  const psid = '26508968658745629'; // PSID của Nguyễn Văn Tuấn

  console.log('\n--- DIAGNOSING AVATAR FOR PSID:', psid, '---');

  // Try 1: Fetch via individual message sender
  console.log('\n1. Fetching last messages to check sender metadata...');
  const msgRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/conversations?user_id=${psid}&fields=messages.limit(1){from{name,email,picture,profile_pic}}&access_token=${token}`);
  const msgData = await msgRes.json();
  console.log(JSON.stringify(msgData, null, 2));

  // Try 2: Fetch via Page-level User Profile API (Old version)
  console.log('\n2. Fetching via v12.0 (Older version often has more legacy support)...');
  const oldRes = await fetch(`https://graph.facebook.com/v12.0/${psid}?fields=name,picture.type(large),profile_pic&access_token=${token}`);
  const oldData = await oldRes.json();
  console.log(JSON.stringify(oldData, null, 2));

  // Try 3: Fetch via IDs for Pages (to check if it's a valid PSID for this page)
  console.log('\n3. Verifying PSID mapping...');
  const idRes = await fetch(`https://graph.facebook.com/v19.0/${psid}/ids_for_pages?access_token=${token}`);
  const idData = await idRes.json();
  console.log(JSON.stringify(idData, null, 2));

  // Try 4: The "Messenger Profile" approach for the user
  console.log('\n4. Trying specific profile fields for Messenger...');
  const mRes = await fetch(`https://graph.facebook.com/v19.0/${psid}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${token}`);
  const mData = await mRes.json();
  console.log(JSON.stringify(mData, null, 2));

  process.exit(0);
}

deepDiagnoseAvatar().catch(err => { console.error(err); process.exit(1); });
