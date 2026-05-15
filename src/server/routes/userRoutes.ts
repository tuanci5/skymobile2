import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { email, name, role, permissions, manager_email, picture } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    await pool.query(
      'INSERT INTO users (email, name, role, permissions, manager_email, picture) VALUES ($1, $2, $3, $4, $5, $6)',
      [email.toLowerCase(), name || email.split('@')[0], role || 'Thành viên', JSON.stringify(permissions || []), manager_email || null, picture || null]
    );
    res.json({ success: true, message: 'User added' });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

router.put('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { name, role, permissions, manager_email, picture } = req.body;
    await pool.query(
      'UPDATE users SET name = $1, role = $2, permissions = $3, manager_email = $4, picture = $5 WHERE email = $6',
      [name, role, JSON.stringify(permissions || []), manager_email || null, picture || null, email.toLowerCase()]
    );
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    await pool.query('DELETE FROM users WHERE email = $1', [email.toLowerCase()]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
