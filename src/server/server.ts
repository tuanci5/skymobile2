import express from 'express';
import cors from 'cors';
import { pool, initDBUtils } from './db';

const app = express();
app.use(cors());
app.use(express.json());

// Init DB Schema
initDBUtils().catch(console.error);

// ─── CANDIDATES API ─────────────────────────────────────────────────────────────

app.get('/api/candidates', async (req, res) => {
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
      source: row.source
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch candidates' });
  }
});

app.post('/api/candidates', async (req, res) => {
  try {
    const { id, name, position, interviewDate, interviewer, status, cvLink, phone, source } = req.body;
    
    await pool.query(
      `INSERT INTO candidates (id, name, position, interview_date, interviewer, status, cv_link, phone, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, name, position, interviewDate, interviewer, status, cvLink, phone, source]
    );
    res.json({ success: true, message: 'Candidate added' });
  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

app.put('/api/candidates/:id/status', async (req, res) => {
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

app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM candidates WHERE id = $1', [id]);
    res.json({ success: true, message: 'Candidate deleted' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// ─── EVALUATIONS API ────────────────────────────────────────────────────────────

app.get('/api/evaluations', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM evaluations');
    const evaluationsData: any = {};
    rows.forEach(row => {
      evaluationsData[row.candidate_id] = {
        scores: row.scores,
        notes: row.notes,
        totalScore: row.total_score,
        strengths: row.strengths,
        weaknesses: row.weaknesses,
        decision: row.decision,
        salaryNote: row.salary_note,
        submittedAt: row.submitted_at
      };
    });
    res.json(evaluationsData);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch evaluations' });
  }
});

app.post('/api/evaluations', async (req, res) => {
  try {
    const { candidateId, scores, notes, totalScore, strengths, weaknesses, decision, salaryNote, submittedAt } = req.body;
    
    await pool.query(
      `INSERT INTO evaluations (candidate_id, scores, notes, total_score, strengths, weaknesses, decision, salary_note, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (candidate_id) DO UPDATE SET
       scores = EXCLUDED.scores, notes = EXCLUDED.notes, total_score = EXCLUDED.total_score,
       strengths = EXCLUDED.strengths, weaknesses = EXCLUDED.weaknesses, decision = EXCLUDED.decision,
       salary_note = EXCLUDED.salary_note, submitted_at = EXCLUDED.submitted_at`,
      [candidateId, JSON.stringify(scores), JSON.stringify(notes), totalScore, strengths, weaknesses, decision, salaryNote, submittedAt]
    );
    res.json({ success: true, message: 'Evaluation saved' });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    res.status(500).json({ error: 'Failed to save evaluation' });
  }
});

// ─── CV DATA API ────────────────────────────────────────────────────────────

app.get('/api/cvs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cv_data');
    const cvDetails: any = {};
    rows.forEach(row => {
      cvDetails[row.candidate_id] = {
        candidateId: row.candidate_id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        dateOfBirth: row.date_of_birth,
        address: row.address,
        education: row.education,
        experience: row.experience,
        skills: row.skills,
        certifications: row.certifications,
        languages: row.languages,
        cvLink: row.cv_link,
        notes: row.notes,
        interviewDate: row.interview_date,
        interviewTime: row.interview_time,
        interviewer: row.interviewer,
        submittedAt: row.submitted_at
      };
    });
    res.json(cvDetails);
  } catch (error) {
    console.error('Error fetching CVs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch CVs' });
  }
});

app.post('/api/cvs', async (req, res) => {
  try {
    const { candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, submittedAt } = req.body;
    
    await pool.query(
      `INSERT INTO cv_data (candidate_id, full_name, email, phone, date_of_birth, address, education, experience, skills, certifications, languages, cv_link, notes, interview_date, interview_time, interviewer, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (candidate_id) DO UPDATE SET
       full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone, date_of_birth = EXCLUDED.date_of_birth,
       address = EXCLUDED.address, education = EXCLUDED.education, experience = EXCLUDED.experience, skills = EXCLUDED.skills,
       certifications = EXCLUDED.certifications, languages = EXCLUDED.languages, cv_link = EXCLUDED.cv_link, notes = EXCLUDED.notes,
       interview_date = EXCLUDED.interview_date, interview_time = EXCLUDED.interview_time, interviewer = EXCLUDED.interviewer,
       submitted_at = EXCLUDED.submitted_at`,
      [candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, submittedAt]
    );
    res.json({ success: true, message: 'CV saved' });
  } catch (error) {
    console.error('Error saving CV:', error);
    res.status(500).json({ error: 'Failed to save CV' });
  }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Unhandled Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ─── EXPORT/START ──────────────────────────────────────────────────────────────

const PORT = 3001;
// Chỉ chạy app.listen nếu không phải môi trường Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });
}

export default app;
