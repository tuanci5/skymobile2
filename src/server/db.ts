import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const { Pool } = pg;

// Only load dotenv in non-Vercel environments
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function initDBUtils() {
  let client;
  try {
    console.log(`📡 DB_HOST: ${process.env.DB_HOST ? 'Configured' : 'MISSING'}`);
    console.log(`📡 Attempting to connect to PostgreSQL at ${process.env.DB_HOST}...`);
    client = await pool.connect();
    
    // Ensure candidates table exists
    await client.query(`
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        candidate_id VARCHAR(50) PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
        scores JSONB,
        notes JSONB,
        total_score INT,
        strengths TEXT,
        weaknesses TEXT,
        decision VARCHAR(50),
        salary_note TEXT,
        submitted_at VARCHAR(100)
      )
    `);

    // Ensure cv_data table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS cv_data (
        candidate_id VARCHAR(50) PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
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
        submitted_at VARCHAR(100)
      )
    `);

    console.log('✅ PostgreSQL schema verified.');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
  } finally {
    if (client) client.release();
  }
}
