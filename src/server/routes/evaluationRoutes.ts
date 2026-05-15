import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM evaluations');
    const evaluationsData: any = {};
    rows.forEach(row => {
      evaluationsData[row.candidateid] = {
        scores: typeof row.scores === 'string' ? JSON.parse(row.scores) : row.scores,
        notes: typeof row.notes === 'string' ? JSON.parse(row.notes) : row.notes,
        totalScore: row.totalscore,
        strengths: row.strengths,
        weaknesses: row.weaknesses,
        decision: row.decision,
        salaryNote: row.salarynote,
        submittedAt: row.submittedat
      };
    });
    res.json(evaluationsData);
  } catch (error: any) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch evaluations' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { candidateId, scores, notes, totalScore, strengths, weaknesses, decision, salaryNote, submittedAt } = req.body;
    
    await pool.query(
      `INSERT INTO evaluations (candidateid, scores, notes, totalscore, strengths, weaknesses, decision, salarynote, submittedat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (candidateid) DO UPDATE SET
       scores = EXCLUDED.scores, notes = EXCLUDED.notes, totalscore = EXCLUDED.totalscore,
       strengths = EXCLUDED.strengths, weaknesses = EXCLUDED.weaknesses, decision = EXCLUDED.decision,
       salarynote = EXCLUDED.salarynote, submittedat = EXCLUDED.submittedat`,
      [candidateId, JSON.stringify(scores), JSON.stringify(notes), totalScore, strengths, weaknesses, decision, salaryNote, submittedAt]
    );
    res.json({ success: true, message: 'Evaluation saved' });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    res.status(500).json({ error: 'Failed to save evaluation' });
  }
});

export default router;
