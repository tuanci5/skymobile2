
const pg = require('pg');
const fetch = require('node-fetch'); // Using node-fetch as global fetch might not be in all node versions

const pool = new pg.Pool({
  host: 'db1136.movads.vn',
  port: 5135,
  user: 'sky1352',
  password: 'Thoigian1@1',
  database: 'sky1352',
});

async function check() {
  try {
    const { rows: pages } = await pool.query('SELECT page_id, page_name, access_token FROM fb_pages');
    console.log('Pages in DB:', pages.map(p => ({ id: p.page_id, name: p.page_name, has_token: !!p.access_token })));

    if (pages.length > 0 && pages[0].access_token) {
      const page = pages[0];
      console.log(`Testing token for page: ${page.page_name}`);
      
      const res = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${page.access_token}`);
      const data = await res.json();
      console.log('Token test (v21.0/me):', data);

      if (data.id) {
        console.log('Token is VALID');
      } else {
        console.log('Token is INVALID');
      }
    }
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await pool.end();
  }
}

check();
