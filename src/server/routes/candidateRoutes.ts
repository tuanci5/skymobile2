import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM candidates ORDER BY created_at DESC');
    const formatted = rows.map(row => ({
      id: row.id,
      name: row.name,
      position: row.position,
      interviewDate: row.interview_date,
      interviewer: row.interviewer,
      status: row.status,
      cvLink: row.cv_link,
      phone: row.phone,
      source: row.source,
      interviewTime: row.interview_time
    }));
    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch candidates' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, name, position, interviewDate, interviewTime, interviewer, status, cvLink, phone, source } = req.body;
    
    await pool.query(
      `INSERT INTO candidates (id, name, position, interview_date, interview_time, interviewer, status, cv_link, phone, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, name, position, interviewDate, interviewTime, interviewer, status, cvLink, phone, source]
    );
    res.json({ success: true, message: 'Candidate added' });
  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.query('UPDATE candidates SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM candidates WHERE id = $1', [id]);
    res.json({ success: true, message: 'Candidate deleted' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

export default router;
