import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Only load dotenv in non-Vercel environments
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDBUtils() {
  let connection;
  try {
    console.log(`📡 Attempting to connect to MySQL at ${process.env.DB_HOST}...`);
    connection = await pool.getConnection();
    
    // Ensure candidates table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        position VARCHAR(255),
        interview_date VARCHAR(50),
        interview_time VARCHAR(50),
        interviewer VARCHAR(255),
        status VARCHAR(255),
        cv_link TEXT,
        phone VARCHAR(50),
        source VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add interview_time column if it doesn't exist (for existing tables)
    try {
      await connection.execute('ALTER TABLE candidates ADD COLUMN interview_time VARCHAR(50) AFTER interview_date');
    } catch (e) {}


    // Ensure evaluations table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS evaluations (
        candidateId VARCHAR(50) PRIMARY KEY,
        scores JSON,
        notes JSON,
        totalScore INT,
        strengths TEXT,
        weaknesses TEXT,
        decision VARCHAR(50),
        salaryNote TEXT,
        submittedAt VARCHAR(100),
        FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Ensure cv_data table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cv_data (
        candidateId VARCHAR(50) PRIMARY KEY,
        fullName VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        dateOfBirth VARCHAR(50),
        address TEXT,
        education TEXT,
        experience TEXT,
        skills TEXT,
        certifications TEXT,
        languages TEXT,
        cvLink TEXT,
        notes TEXT,
        interviewDate VARCHAR(50),
        interviewTime VARCHAR(50),
        interviewer VARCHAR(255),
        submittedAt VARCHAR(100),
        FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ MySQL schema verified.');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
  } finally {
    if (connection) connection.release();
  }
}
