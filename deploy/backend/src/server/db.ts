import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Only load dotenv in non-Vercel environments
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  connectionTimeoutMillis: 10000, // 10 seconds timeout
  idleTimeoutMillis: 30000,
  ssl: process.env.DB_HOST?.includes('supabase') ? { rejectUnauthorized: false } : false // SSL for Supabase
});

export async function initDBUtils() {
  const connection = await pool.connect();
  try {
    console.log(`📡 Attempting to connect to database at ${process.env.DB_HOST}...`);
    
    // Ensure candidates table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        position VARCHAR(255),
        interview_date VARCHAR(50),
        interviewer VARCHAR(255),
        status VARCHAR(255),
        cv_link TEXT,
        phone VARCHAR(50),
        source VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure evaluations table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        candidate_id VARCHAR(50) PRIMARY KEY,
        scores JSONB,
        notes JSONB,
        total_score INT,
        strengths TEXT,
        weaknesses TEXT,
        decision VARCHAR(50),
        salary_note TEXT,
        submitted_at VARCHAR(100),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Ensure cv_data table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cv_data (
        candidate_id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        date_of_birth VARCHAR(50),
        address TEXT,
        education TEXT,
        experience TEXT,
        skills TEXT,
        certifications TEXT,
        languages TEXT,
        cv_link TEXT,
        notes TEXT,
        interview_date VARCHAR(50),
        interview_time VARCHAR(50),
        interviewer VARCHAR(255),
        submitted_at VARCHAR(100),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database schema verified.');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
    if (err.code === 'ETIMEDOUT') {
      console.error('👉 Tip: Check your server firewall and ensure port 5432 is open.');
    }
  } finally {
    connection.release();
  }
}
