const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function check() {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const { rows } = await pool.query('SELECT * FROM candidates ORDER BY created_at DESC');
    console.log(`Fetched ${rows.length} candidates successfully.`);
  } catch (e) {
    console.error('Error fetching candidates:', e);
  }

  try {
    const { rows } = await pool.query('SELECT * FROM evaluations');
    console.log(`Fetched ${rows.length} evaluations successfully.`);
  } catch (e) {
    console.error('Error fetching evaluations:', e);
  }

  try {
    const { rows } = await pool.query('SELECT * FROM cv_data');
    console.log(`Fetched ${rows.length} cv_data successfully.`);
  } catch (e) {
    console.error('Error fetching cv_data:', e);
  }

  await pool.end();
}

check();
