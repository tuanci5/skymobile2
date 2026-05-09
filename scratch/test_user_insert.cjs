const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new pg.Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function test() {
  try {
    console.log("Testing DB connection...");
    const client = await pool.connect();
    
    // Check columns in users table
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    
    console.log("Columns in users table:");
    console.table(res.rows);

    // Try inserting a test user
    console.log("Trying to insert test user...");
    await client.query(
      'INSERT INTO users (email, name, role, permissions, manager_email, picture) VALUES ($1, $2, $3, $4, $5, $6)',
      ['test_user_123@gmail.com', 'Test User', 'Thành viên', JSON.stringify([]), null, null]
    );
    console.log("Insert successful!");

    // Try again to trigger duplicate error
    console.log("Trying to insert same user again to see error code...");
    try {
      await client.query(
        'INSERT INTO users (email, name, role, permissions, manager_email, picture) VALUES ($1, $2, $3, $4, $5, $6)',
        ['test_user_123@gmail.com', 'Test User', 'Thành viên', JSON.stringify([]), null, null]
      );
    } catch (err) {
      console.log("Caught expected error:");
      console.log("Code:", err.code);
      console.log("Message:", err.message);
      console.log("Detail:", err.detail);
    }

    // Cleanup
    await client.query("DELETE FROM users WHERE email = 'test_user_123@gmail.com'");
    
    client.release();
  } catch (e) {
    console.error("Test failed with error:", e.message);
  } finally {
    pool.end();
  }
}

test();
