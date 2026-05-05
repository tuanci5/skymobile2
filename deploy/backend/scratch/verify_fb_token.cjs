const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function checkToken() {
  try {
    const { rows } = await pool.query("SELECT page_id, access_token FROM fb_pages WHERE page_id = '110637815342960'");
    if (rows.length === 0) {
      console.log('Page not found');
      return;
    }
    const token = rows[0].access_token;
    
    console.log('Checking token info...');
    const res = await fetch(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`);
    const data = await res.json();
    console.log('Token Debug Info:', JSON.stringify(data, null, 2));
    
    console.log('\nChecking Page Info...');
    const res2 = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,permissions&access_token=${token}`);
    const data2 = await res2.json();
    console.log('Page Info:', JSON.stringify(data2, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkToken();
