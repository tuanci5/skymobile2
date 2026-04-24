import express from 'express';
import cors from 'cors';
import { pool, initDBUtils } from './db';

const app = express();
app.use(cors());
app.use(express.json());

// Database initialization state
let isDbInitialized = false;
const dbInitPromise = initDBUtils().then(() => { isDbInitialized = true; });

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await dbInitPromise;
    } catch (err) {
      return res.status(500).json({ error: 'Database initialization failed', details: err.message });
    }
  }
  next();
});

// ─── DEBUG API ────────────────────────────────────────────────────────────────
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    env: {
      has_host: !!process.env.DB_HOST,
      has_user: !!process.env.DB_USER,
      has_pass: !!process.env.DB_PASSWORD,
      has_db: !!process.env.DB_NAME,
      node_env: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL
    }
  });
});

// ─── CANDIDATES API ─────────────────────────────────────────────────────────────

app.get('/api/candidates', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM candidates ORDER BY created_at DESC');
    const formatted = (rows as any[]).map(row => ({
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
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch candidates' });
  }
});

app.post('/api/candidates', async (req, res) => {
  try {
    const { id, name, position, interviewDate, interviewTime, interviewer, status, cvLink, phone, source } = req.body;
    
    await pool.query(
      `INSERT INTO candidates (id, name, position, interview_date, interview_time, interviewer, status, cv_link, phone, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, position, interviewDate, interviewTime, interviewer, status, cvLink, phone, source]
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
    
    await pool.query('UPDATE candidates SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM candidates WHERE id = ?', [id]);
    res.json({ success: true, message: 'Candidate deleted' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// ─── EVALUATIONS API ────────────────────────────────────────────────────────────

app.get('/api/evaluations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM evaluations');
    const evaluationsData: any = {};
    (rows as any[]).forEach(row => {
      evaluationsData[row.candidateId] = {
        scores: typeof row.scores === 'string' ? JSON.parse(row.scores) : row.scores,
        notes: typeof row.notes === 'string' ? JSON.parse(row.notes) : row.notes,
        totalScore: row.totalScore,
        strengths: row.strengths,
        weaknesses: row.weaknesses,
        decision: row.decision,
        salaryNote: row.salaryNote,
        submittedAt: row.submittedAt
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
      `INSERT INTO evaluations (candidateId, scores, notes, totalScore, strengths, weaknesses, decision, salaryNote, submittedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       scores = VALUES(scores), notes = VALUES(notes), totalScore = VALUES(totalScore),
       strengths = VALUES(strengths), weaknesses = VALUES(weaknesses), decision = VALUES(decision),
       salaryNote = VALUES(salaryNote), submittedAt = VALUES(submittedAt)`,
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
    const [rows] = await pool.query('SELECT * FROM cv_data');
    const cvDetails: any = {};
    (rows as any[]).forEach(row => {
      cvDetails[row.candidateId] = row;
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
      `INSERT INTO cv_data (candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, submittedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       fullName = VALUES(fullName), email = VALUES(email), phone = VALUES(phone), dateOfBirth = VALUES(dateOfBirth),
       address = VALUES(address), education = VALUES(education), experience = VALUES(experience), skills = VALUES(skills),
       certifications = VALUES(certifications), languages = VALUES(languages), cvLink = VALUES(cvLink), notes = VALUES(notes),
       interviewDate = VALUES(interviewDate), interviewTime = VALUES(interviewTime), interviewer = VALUES(interviewer),
       submittedAt = VALUES(submittedAt)`,
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
