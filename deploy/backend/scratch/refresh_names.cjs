const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function refreshNames() {
  try {
    const { rows: convs } = await pool.query("SELECT c.id, c.customer_id, p.access_token FROM fb_conversations c JOIN fb_pages p ON c.page_id = p.page_id WHERE c.customer_name = 'Khách hàng FB'");
    
    console.log(`Found ${convs.length} conversations to refresh.`);
    
    for (const conv of convs) {
      console.log(`Fetching profile for ${conv.customer_id}...`);
      const res = await fetch(`https://graph.facebook.com/v19.0/${conv.customer_id}?fields=first_name,last_name&access_token=${conv.access_token}`);
      const data = await res.json();
      
      if (data.first_name || data.last_name) {
        const name = `${data.last_name || ''} ${data.first_name || ''}`.trim();
        console.log(`Updating name to: ${name}`);
        await pool.query('UPDATE fb_conversations SET customer_name = $1 WHERE id = $2', [name, conv.id]);
      } else {
        console.log('Failed to fetch name:', data.error || 'Unknown error');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

refreshNames();
