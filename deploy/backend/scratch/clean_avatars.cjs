const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false
});

(async () => {
  try {
    const r = await pool.query(
      "UPDATE fb_conversations SET customer_avatar = NULL, avatar_url = NULL WHERE customer_avatar LIKE '%avatar-proxy%' OR customer_avatar LIKE '%/picture?%'"
    );
    console.log('Cleaned rows:', r.rowCount);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
