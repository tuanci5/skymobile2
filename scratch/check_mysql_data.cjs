const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'db1136.movads.vn',
    port: 3306,
    user: 'skymobile',
    password: 'DftX3Bj25DmF4wpn',
    database: 'skymobile'
  });

  const [candidates] = await connection.execute('SELECT * FROM candidates LIMIT 1');
  const [cv_data] = await connection.execute('SELECT * FROM cv_data LIMIT 1');
  const [evaluations] = await connection.execute('SELECT * FROM evaluations LIMIT 1');
  
  console.log("Candidates sample:", candidates);
  console.log("CV Data sample:", cv_data);
  console.log("Evaluations sample:", evaluations);

  await connection.end();
}

main().catch(console.error);
