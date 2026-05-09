const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function addColumn() {
  try {
    await pool.query('ALTER TABLE cv_data ADD COLUMN IF NOT EXISTS hr_notes JSONB');
    console.log('Column hr_notes added successfully to cv_data');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await pool.end();
  }
}

addColumn();
