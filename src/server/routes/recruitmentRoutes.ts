import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM recruitment_plans ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recruitment plans:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to fetch plans' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { position, target_quantity, note, start_date, end_date } = req.body;
    await pool.query(
      'INSERT INTO recruitment_plans (position, target_quantity, note, start_date, end_date) VALUES ($1, $2, $3, $4, $5)',
      [position, target_quantity, note, start_date, end_date]
    );
    res.json({ success: true, message: 'Plan added' });
  } catch (error) {
    console.error('Error adding recruitment plan:', error);
    res.status(500).json({ error: 'Failed to add plan' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { position, target_quantity, note, status, start_date, end_date } = req.body;
    await pool.query(
      'UPDATE recruitment_plans SET position = $1, target_quantity = $2, note = $3, status = $4, start_date = $5, end_date = $6 WHERE id = $7',
      [position, target_quantity, note, status, start_date, end_date, id]
    );
    res.json({ success: true, message: 'Plan updated' });
  } catch (error) {
    console.error('Error updating recruitment plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM recruitment_plans WHERE id = $1', [id]);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    console.error('Error deleting recruitment plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

export default router;
