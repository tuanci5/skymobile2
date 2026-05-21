import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    
    // Insert admin user
    await pool.query(`
      INSERT INTO users (email, name, role, picture) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        picture = EXCLUDED.picture
    `, ['admin@skymobile.dev', 'Quản trị viên', 'Quản trị', 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=3b82f6&textColor=ffffff']);
    
    console.log('✅ Admin user seeded.');

    // Insert default role permissions
    const roles = [
      { role: 'Quản trị', allowed_tabs: ['model', 'hr', 'salary', 'training', 'business', 'action-plan', 'products', 'users', 'tasks', 'messenger', 'revenue', 'customers', 'order-approvals'] },
      { role: 'Trưởng phòng Kinh doanh Marketing', allowed_tabs: ['model', 'hr', 'training', 'business', 'tasks', 'messenger', 'revenue', 'customers', 'order-approvals'] },
      { role: 'Trưởng nhóm Marketing', allowed_tabs: ['model', 'hr', 'training', 'tasks', 'messenger', 'revenue', 'customers'] },
      { role: 'Trưởng nhóm Sale', allowed_tabs: ['model', 'hr', 'training', 'tasks', 'messenger', 'revenue', 'customers'] },
      { role: 'Trưởng nhóm CSKH', allowed_tabs: ['model', 'hr', 'training', 'tasks', 'messenger', 'revenue', 'customers'] },
      { role: 'Nhân viên Sale', allowed_tabs: ['model', 'tasks', 'messenger'] },
      { role: 'Nhân viên CSKH', allowed_tabs: ['model', 'tasks', 'messenger', 'revenue'] },
      { role: 'Nhân viên Chăm sóc khách hàng', allowed_tabs: ['model', 'tasks', 'messenger', 'revenue'] }
    ];

    for (const r of roles) {
      await pool.query(`
        INSERT INTO role_permissions (role, allowed_tabs) 
        VALUES ($1, $2) 
        ON CONFLICT (role) DO UPDATE SET allowed_tabs = EXCLUDED.allowed_tabs
      `, [r.role, JSON.stringify(r.allowed_tabs)]);
    }
    
    console.log('✅ Role permissions seeded.');
    
    console.log('✨ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
