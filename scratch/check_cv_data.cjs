const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkData() {
  try {
    const res = await pool.query('SELECT candidateid, fullname, hr_notes FROM cv_data');
    console.log('CV Data (hr_notes):');
    res.rows.forEach(row => {
      console.log(`- Candidate: ${row.fullname} (${row.candidateid})`);
      console.log(`  hr_notes: ${JSON.stringify(row.hr_notes)}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkData();
