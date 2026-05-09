const mysql = require('mysql2/promise');
const { Client } = require('pg');

async function migrate() {
  // MySQL connection
  const mysqlConn = await mysql.createConnection({
    host: 'db1136.movads.vn',
    port: 3306,
    user: 'skymobile',
    password: 'DftX3Bj25DmF4wpn',
    database: 'skymobile'
  });

  // PG connection (from .env.local)
  const pgClient = new Client({
    host: 'db1136.movads.vn',
    port: 5135,
    user: 'sky1352',
    password: 'Thoigian1@1',
    database: 'sky1352'
  });

  try {
    await pgClient.connect();
    console.log('Connected to both databases.');

    // Fetch users from MySQL
    const [mysqlUsers] = await mysqlConn.execute('SELECT * FROM users');
    console.log(`Fetched ${mysqlUsers.length} users from MySQL.`);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const user of mysqlUsers) {
      // Handle permissions being string in MySQL but JSONB in PG
      // If it's already an object (from mysql2), we might need to stringify it if PG driver doesn't handle it
      // Actually mysql2 usually returns JSON columns as objects if the server supports it, or strings.
      let permissions = user.permissions;
      if (typeof permissions === 'string') {
          try {
              permissions = JSON.parse(permissions);
          } catch (e) {
              permissions = null;
          }
      }

      const query = `
        INSERT INTO users (email, manager_email, name, role, permissions, picture, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) 
        DO UPDATE SET 
          manager_email = EXCLUDED.manager_email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          permissions = EXCLUDED.permissions,
          picture = EXCLUDED.picture,
          created_at = EXCLUDED.created_at
        RETURNING (xmax = 0) AS inserted;
      `;

      const values = [
        user.email,
        user.manager_email,
        user.name,
        user.role,
        permissions ? JSON.stringify(permissions) : null,
        user.picture,
        user.created_at
      ];

      const res = await pgClient.query(query, values);
      if (res.rows[0].inserted) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`Migration complete!`);
    console.log(`Inserted: ${insertedCount}`);
    console.log(`Updated/Synced: ${updatedCount}`);
    console.log(`Total: ${mysqlUsers.length}`);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mysqlConn.end();
    await pgClient.end();
  }
}

migrate();
