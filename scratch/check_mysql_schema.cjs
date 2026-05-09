const mysql = require('mysql2/promise');

async function checkMysql() {
  const connection = await mysql.createConnection({
    host: 'db1136.movads.vn',
    port: 3306,
    user: 'skymobile',
    password: 'DftX3Bj25DmF4wpn',
    database: 'skymobile'
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM users LIMIT 1');
    console.log('Columns:', Object.keys(rows[0] || {}));
    console.log('Sample Row:', rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

checkMysql();
