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
        permissions JSON,
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration to add permissions and manager_email
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN permissions JSON AFTER role');
    } catch (e) {}
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN manager_email VARCHAR(255) AFTER email');
    } catch (e) {}

    // Seed DEV_ACCOUNTS so they exist in DB for testing
    const devAccounts = [
      { email: 'admin@skymobile.dev', name: 'System Administrator', role: 'Quản trị', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=3b82f6&textColor=ffffff' },
      { email: 'mkt_lead@skymobile.dev', name: 'Marketing Lead', role: 'Trưởng nhóm Marketing', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=ML&backgroundColor=8b5cf6&textColor=ffffff' },
      { email: 'sale_lead@skymobile.dev', name: 'Sale Lead', role: 'Trưởng nhóm Sale', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=SL&backgroundColor=10b981&textColor=ffffff' },
      { email: 'cskh_lead@skymobile.dev', name: 'CSKH Lead', role: 'Trưởng nhóm CSKH', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=CL&backgroundColor=f59e0b&textColor=ffffff' },
      { email: 'ads@skymobile.dev', name: 'Ads Specialist', role: 'Nhân viên Quảng cáo', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=AS&backgroundColor=ef4444&textColor=ffffff' },
      { email: 'content@skymobile.dev', name: 'Content Creator', role: 'Nhân viên Content', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=CC&backgroundColor=ec4899&textColor=ffffff' },
      { email: 'sale@skymobile.dev', name: 'Sale Executive', role: 'Nhân viên Sale', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=SE&backgroundColor=06b6d4&textColor=ffffff' },
      { email: 'accountant@skymobile.dev', name: 'Accountant', role: 'Nhân viên kế toán tổng hợp', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=AC&backgroundColor=6366f1&textColor=ffffff' },
      { email: 'hr@skymobile.dev', name: 'HR Admin', role: 'Nhân viên Hành chính & Nhân sự', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=HR&backgroundColor=f97316&textColor=ffffff' },
      { email: 'telesale@skymobile.dev', name: 'Telesale Staff', role: 'Telesale', picture: 'https://api.dicebear.com/9.x/initials/svg?seed=TS&backgroundColor=84cc16&textColor=ffffff' },
    ];
    
    for (const acc of devAccounts) {
      await connection.execute(
        'INSERT IGNORE INTO users (email, name, role, picture) VALUES (?, ?, ?, ?)',
        [acc.email, acc.name, acc.role, acc.picture]
      );
    }

    // Ensure role_permissions table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role VARCHAR(100) PRIMARY KEY,
        allowed_tabs JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

    // Ensure tasks table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigner_email VARCHAR(255) NOT NULL,
        assignee_email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Cần làm',
        due_date VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigner_email) REFERENCES users(email) ON DELETE CASCADE,
        FOREIGN KEY (assignee_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    // Ensure task_comments table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    // Ensure task_assignees table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS task_assignees (
        task_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        PRIMARY KEY (task_id, user_email),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    // Migration for existing tasks table
    try {
      await connection.execute('ALTER TABLE tasks ADD COLUMN result_handover TEXT');
    } catch (e) {}
    try {
      await connection.execute('ALTER TABLE tasks ADD COLUMN report_url VARCHAR(255)');
    } catch (e) {}
    try {
      await connection.execute('ALTER TABLE tasks ADD COLUMN task_group VARCHAR(255) AFTER title');
    } catch (e) {}
    try {
      await connection.execute('ALTER TABLE tasks ADD COLUMN progress INT DEFAULT 0');
    } catch (e) {}
    try {
      await connection.execute('ALTER TABLE tasks ADD COLUMN parent_task_id INT NULL');
    } catch (e) {}

    // Ensure task_subtasks table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS task_subtasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        title VARCHAR(500) NOT NULL,
        is_completed TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Ensure teams table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    // Migration for existing teams table to add owner_email if missing
    try {
      await connection.execute('ALTER TABLE teams ADD COLUMN owner_email VARCHAR(255) NOT NULL DEFAULT "tuanci5@gmail.com" AFTER name');
      await connection.execute('ALTER TABLE teams ADD FOREIGN KEY (owner_email) REFERENCES users(email) ON DELETE CASCADE');
    } catch (e) {}

    // Ensure team_members table exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        PRIMARY KEY (team_id, user_email),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    // Migrate existing assignee_email to task_assignees
    try {
      await connection.execute(`
        INSERT IGNORE INTO task_assignees (task_id, user_email)
        SELECT id, assignee_email FROM tasks WHERE assignee_email IS NOT NULL AND assignee_email != ''
      `);
    } catch (e) {
      console.warn('Could not migrate assignees:', e.message);
    }

    console.log('✅ MySQL schema verified.');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
  } finally {
    if (connection) connection.release();
  }
}
