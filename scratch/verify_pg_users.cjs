const { Client } = require('pg');

async function checkPg() {
  const pgClient = new Client({
    host: 'db1136.movads.vn',
    port: 5135,
    user: 'sky1352',
    password: 'Thoigian1@1',
    database: 'sky1352'
  });

  try {
    await pgClient.connect();
    const res = await pgClient.query('SELECT COUNT(*) FROM users');
    console.log('Total users in PG:', res.rows[0].count);
    
    const sample = await pgClient.query('SELECT email, name, role FROM users LIMIT 5');
    console.log('Sample users:', sample.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pgClient.end();
  }
}

checkPg();
