import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Only load dotenv in non-Vercel environments
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

export const pool = new pg.Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function initDBUtils() {
  let client;
  try {
    console.log(`📡 Attempting to connect to PostgreSQL at ${process.env.DB_HOST}...`);
    client = await pool.connect();
    
    // Ensure candidates table exists
    await client.query(`
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
      await client.query('ALTER TABLE candidates ADD COLUMN interview_time VARCHAR(50)');
    } catch (e) {}


    // Ensure evaluations table exists
    await client.query(`
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
    await client.query(`
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
        source VARCHAR(255),
        submittedAt VARCHAR(100),
        FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE
      )
    `);

    // Add source column if it doesn't exist (for existing cv_data tables)
    try {
      await client.query('ALTER TABLE cv_data ADD COLUMN source VARCHAR(255)');
    } catch (e) {}

    // FB Messenger Integration Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS fb_pages (
        id SERIAL PRIMARY KEY,
        page_id VARCHAR(100) UNIQUE NOT NULL,
        page_name VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        dify_api_key TEXT,
        distribution_mode VARCHAR(50) DEFAULT 'manual', -- 'manual', 'round_robin', 'ai_first'
        assigned_users JSONB DEFAULT '[]'::jsonb,
        ai_reply_delay INT DEFAULT 5,
        ai_start_hour INT DEFAULT 0,
        ai_end_hour INT DEFAULT 24,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add distribution_mode if missing
    try {
      await client.query("ALTER TABLE fb_pages ADD COLUMN distribution_mode VARCHAR(50) DEFAULT 'manual'");
    } catch (e) {}

    // Add assigned_users if missing
    try {
      await client.query("ALTER TABLE fb_pages ADD COLUMN assigned_users JSONB DEFAULT '[]'::jsonb");
    } catch (e) {}

    // Add ai_reply_delay if missing
    try {
      await client.query("ALTER TABLE fb_pages ADD COLUMN ai_reply_delay INT DEFAULT 5");
    } catch (e) {}

    // Add AI schedule if missing
    try {
      await client.query("ALTER TABLE fb_pages ADD COLUMN ai_start_hour INT DEFAULT 0");
      await client.query("ALTER TABLE fb_pages ADD COLUMN ai_end_hour INT DEFAULT 24");
    } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS fb_conversations (
        id SERIAL PRIMARY KEY,
        page_id VARCHAR(100) NOT NULL REFERENCES fb_pages(page_id) ON DELETE CASCADE,
        customer_id VARCHAR(100) NOT NULL,
        customer_name VARCHAR(255),
        customer_avatar TEXT,
        avatar_url TEXT,
        ad_id VARCHAR(100),
        campaign_name VARCHAR(255),
        ad_cost DECIMAL(10,2),
        dify_conversation_id VARCHAR(100),
        is_human_intervened BOOLEAN DEFAULT false,
        assigned_to VARCHAR(255), -- Email/Name of the assigned staff
        last_message TEXT,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unread_count INT DEFAULT 0,
        profile_link TEXT,
        UNIQUE(page_id, customer_id)
      )
    `);

    // Add profile_link if missing
    try {
      await client.query("ALTER TABLE fb_conversations ADD COLUMN profile_link TEXT");
    } catch (e) {}

    // Add avatar_url if missing. customer_avatar is kept for backward compatibility.
    try {
      await client.query("ALTER TABLE fb_conversations ADD COLUMN avatar_url TEXT");
    } catch (e) {}
    await client.query("UPDATE fb_conversations SET avatar_url = customer_avatar WHERE avatar_url IS NULL AND customer_avatar IS NOT NULL");

    // Add assigned_to if missing
    try {
      await client.query("ALTER TABLE fb_conversations ADD COLUMN assigned_to VARCHAR(255)");
    } catch (e) {}

    // Add manual_profile_url for staff to manually enter customer FB profile URL
    try {
      await client.query("ALTER TABLE fb_conversations ADD COLUMN manual_profile_url TEXT");
    } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS fb_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INT NOT NULL REFERENCES fb_conversations(id) ON DELETE CASCADE,
        sender_type VARCHAR(50) NOT NULL, -- 'user', 'ai', 'human'
        message_text TEXT,
        ai_translation TEXT,
        ai_translation_language VARCHAR(50) DEFAULT 'Vietnamese',
        translated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add AI translation cache columns if missing
    try {
      await client.query("ALTER TABLE fb_messages ADD COLUMN ai_translation TEXT");
    } catch (e) {}
    try {
      await client.query("ALTER TABLE fb_messages ADD COLUMN ai_translation_language VARCHAR(50) DEFAULT 'Vietnamese'");
    } catch (e) {}
    try {
      await client.query("ALTER TABLE fb_messages ADD COLUMN translated_at TIMESTAMP");
    } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS fb_conversation_notes (
        id SERIAL PRIMARY KEY,
        conversation_id INT NOT NULL REFERENCES fb_conversations(id) ON DELETE CASCADE,
        note_text TEXT NOT NULL,
        author_name VARCHAR(255),
        author_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const { rows: noteColumnRows } = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'fb_conversations'
        AND column_name = 'customer_note'
    `);

    if (noteColumnRows.length > 0) {
      await client.query(`
        INSERT INTO fb_conversation_notes (conversation_id, note_text, author_name, created_at)
        SELECT id, customer_note, 'Hệ thống', COALESCE(last_message_at, CURRENT_TIMESTAMP)
        FROM fb_conversations c
        WHERE customer_note IS NOT NULL
          AND btrim(customer_note) <> ''
          AND NOT EXISTS (
            SELECT 1
            FROM fb_conversation_notes n
            WHERE n.conversation_id = c.id
              AND n.note_text = c.customer_note
          )
      `);
    }

    // Ensure users table exists for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        manager_email VARCHAR(255),
        name VARCHAR(255),
        role VARCHAR(100),
        permissions JSONB,
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure role_permissions table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role VARCHAR(100) PRIMARY KEY,
        allowed_tabs JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure recruitment_plans table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS recruitment_plans (
        id SERIAL PRIMARY KEY,
        position VARCHAR(255),
        target_quantity INT,
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        note TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure tasks table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        task_group VARCHAR(255),
        description TEXT,
        assigner_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        assignee_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Cần làm',
        due_date VARCHAR(50),
        result_handover TEXT,
        report_url VARCHAR(255),
        progress INT DEFAULT 0,
        parent_task_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure task_comments table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id SERIAL PRIMARY KEY,
        task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure task_assignees table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_assignees (
        task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        PRIMARY KEY (task_id, user_email)
      )
    `);

    // Ensure task_subtasks table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_subtasks (
        id SERIAL PRIMARY KEY,
        task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure teams table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure team_members table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        PRIMARY KEY (team_id, user_email)
      )
    `);

    // Ensure app_settings table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure accounts table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        account_type VARCHAR(100) NOT NULL,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        two_factor TEXT,
        recovery_email VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    
    console.log('✅ PostgreSQL schema verified.');
  } catch (err: any) {
    console.error('❌ Database Initialization Failed:', err.message);
  } finally {
    if (client) client.release();
  }
}
