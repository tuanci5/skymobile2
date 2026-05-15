import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Endpoint to verify user email and return role/permissions
router.get('/verify', async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`[AUTH] Verifying email: ${email}`);

    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email.toLowerCase()]);
    
    if (rows.length > 0) {
      console.log(`[AUTH] User found: ${rows[0].name} (${rows[0].role})`);
      res.json({ 
        authorized: true, 
        user: rows[0] 
      });
    } else {
      console.log(`[AUTH] User NOT found in database: ${email}`);
      res.json({ authorized: false });
    }
  } catch (error: any) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Failed to verify user', details: error.message });
  }
});

export default router;
