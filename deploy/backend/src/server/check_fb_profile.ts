import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
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

async function checkProfile() {
  try {
    const { rows: pages } = await pool.query('SELECT access_token FROM fb_pages WHERE page_id = $1', ['110637815342960']);
    const token = pages[0].access_token;
    const psid = '61582367195833';

    console.log(`Checking profile for PSID: ${psid} with token: ${token.substring(0, 10)}...`);
    
    const res = await fetch(`https://graph.facebook.com/v19.0/${psid}?fields=name,picture.type(large)&access_token=${token}`);
    const data = await res.json();
    
    console.log('FB API Response:', JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkProfile();
