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
        interviewer VARCHAR(255),
        status VARCHAR(255),
        cv_link TEXT,
        phone VARCHAR(50),
        source VARCHAR(255),
        interview_time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        position VARCHAR(255),
        status VARCHAR(255),
        hrNotes JSON,
        submittedAt VARCHAR(100),
        FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Add interview_time column to candidates if it doesn't exist
    try {
      const [columns] = await connection.execute('SHOW COLUMNS FROM candidates LIKE "interview_time"');
      if ((columns as any[]).length === 0) {
        await connection.execute('ALTER TABLE candidates ADD COLUMN interview_time VARCHAR(50) AFTER interview_date');
      }
    } catch (err) {
      console.warn('Could not add interview_time to candidates:', err.message);
    }

    // Add position column if it doesn't exist (for existing databases)
    try {
      const [columns] = await connection.execute('SHOW COLUMNS FROM cv_data LIKE "position"');
      if ((columns as any[]).length === 0) {
        console.log('Adding "position" column to "cv_data" table...');
        await connection.execute('ALTER TABLE cv_data ADD COLUMN position VARCHAR(255) AFTER interviewer');
      }
    } catch (err) {
      console.warn('Failed to add "position" column:', err.message);
    }

    // Add status column if it doesn't exist (for existing databases)
    try {
      const [columns] = await connection.execute('SHOW COLUMNS FROM cv_data LIKE "status"');
      if ((columns as any[]).length === 0) {
        console.log('Adding "status" column to "cv_data" table...');
        await connection.execute('ALTER TABLE cv_data ADD COLUMN status VARCHAR(255) AFTER position');
      }
    } catch (err) {
      console.warn('Failed to add "status" column:', err.message);
    }

    // Add hrNotes column if it doesn't exist (for existing databases)
    try {
      const [columns] = await connection.execute('SHOW COLUMNS FROM cv_data LIKE "hrNotes"');
      if ((columns as any[]).length === 0) {
        console.log('Adding "hrNotes" column to "cv_data" table...');
        await connection.execute('ALTER TABLE cv_data ADD COLUMN hrNotes JSON AFTER status');
      }
    } catch (err) {
      console.warn('Failed to add "hrNotes" column:', err.message);
    }

    // Ensure users table exists for authentication
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        role VARCHAR(100),
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure recruitment_plans table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recruitment_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position VARCHAR(255),
        target_quantity INT,
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        note TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration for existing recruitment_plans table
    try {
      await connection.execute('ALTER TABLE recruitment_plans ADD COLUMN start_date VARCHAR(50) AFTER target_quantity');
      await connection.execute('ALTER TABLE recruitment_plans ADD COLUMN end_date VARCHAR(50) AFTER start_date');
    } catch (e) {}

    console.log('✅ MySQL schema verified.');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
  } finally {
    if (connection) connection.release();
  }
}
