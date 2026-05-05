const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function subscribe() {
  try {
    const res = await pool.query('SELECT access_token, page_id FROM fb_pages WHERE page_id = $1', ['110637815342960']);
    if (res.rows.length === 0) {
      console.log('Page not found in DB');
      return;
    }
    const { access_token, page_id } = res.rows[0];
    console.log(`Subscribing page ${page_id}...`);
    
    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${page_id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${access_token}`, {
      method: 'POST'
    });
    
    const data = await fbRes.json();
    console.log('FB Response:', data);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

subscribe();
