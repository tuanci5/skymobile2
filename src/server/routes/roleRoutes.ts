import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM role_permissions');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { role, allowed_tabs } = req.body;
    await pool.query(
      'INSERT INTO role_permissions (role, allowed_tabs) VALUES ($1, $2) ON CONFLICT (role) DO UPDATE SET allowed_tabs = EXCLUDED.allowed_tabs',
      [role, JSON.stringify(allowed_tabs)]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving role permissions:', error);
    res.status(500).json({ error: 'Failed to save role permissions' });
  }
});

export default router;
