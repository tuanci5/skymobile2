const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'db1136.movads.vn',
    port: 3306,
    user: 'skymobile',
    password: 'DftX3Bj25DmF4wpn',
    database: 'skymobile'
  });

  console.log("Connected to MySQL.");
  const [tables] = await connection.execute('SHOW TABLES');
  console.log("Tables:");
  console.log(tables);

  await connection.end();
}

main().catch(console.error);
