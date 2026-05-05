const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function debugToken() {
  try {
    const res = await pool.query('SELECT access_token, page_id FROM fb_pages WHERE page_id = $1', ['110637815342960']);
    if (res.rows.length === 0) return;
    const { access_token } = res.rows[0];
    
    console.log('Verifying token...');
    const fbRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${access_token}`);
    const data = await fbRes.json();
    console.log('Token Info:', data);
    
    if (data.id) {
       console.log('Token is valid for page:', data.name);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

debugToken();
