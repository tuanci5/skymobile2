import express from 'express';
import cors from 'cors';
import { pool, initDBUtils } from './db';
import fbMessengerRouter from './fbMessenger';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/fb', fbMessengerRouter);

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

const TRANSLATION_TARGET_LANGUAGE = 'Vietnamese';
const TRANSLATION_CACHE_LANGUAGE = 'Vietnamese:auto-detect:v2';
const TRANSLATION_SYSTEM_PROMPT = [
  'You are a strict translation engine.',
  'Auto-detect the source language from the user text. Do not assume the source language is English.',
  `Always translate to ${TRANSLATION_TARGET_LANGUAGE} only.`,
  'If the text is already Vietnamese, return natural Vietnamese with the same meaning.',
  'Preserve names, product names, URLs, phone numbers, prices, emojis, line breaks, and markdown emphasis.',
  'Do not answer the message. Return only the Vietnamese translation with no explanation.'
].join(' ');

const buildTranslationQuery = (text: string) => [
  'Translate the following customer message to Vietnamese.',
  'Auto-detect the source language. Return only the Vietnamese translation.',
  '',
  text
].join('\n');

const buildTranslationRequestBody = (endpoint: string, model: string, text: string) => {
  if (/\/chat-messages(?:[/?#]|$)/i.test(endpoint)) {
    return {
      inputs: {},
      query: `${TRANSLATION_SYSTEM_PROMPT}\n\n${buildTranslationQuery(text)}`,
      response_mode: 'blocking',
      conversation_id: '',
      user: 'sky-mobile-translation'
    };
  }

  return {
    model,
    messages: [
      {
        role: 'system',
        content: TRANSLATION_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: buildTranslationQuery(text)
      }
    ],
    temperature: 0.1
  };
};

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

// ─── AUTHENTICATION API ───────────────────────────────────────────────────────
app.get('/api/auth/verify', async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (rows.length > 0) {
      res.json({ authorized: true, user: rows[0] });
    } else {
      res.json({ authorized: false });
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

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
      source: row.source,
      interviewTime: row.interview_time
    }));
    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch candidates' });
  }
});

app.post('/api/candidates', async (req, res) => {
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

app.post('/api/evaluations', async (req, res) => {
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

// ─── CV DATA API ────────────────────────────────────────────────────────────

app.get('/api/cvs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cv_data');
    const cvDetails: any = {};
    rows.forEach(row => {
      cvDetails[row.candidateid] = {
        candidateId: row.candidateid,
        fullName: row.fullname,
        email: row.email,
        phone: row.phone,
        dateOfBirth: row.dateofbirth,
        address: row.address,
        education: row.education,
        experience: row.experience,
        skills: row.skills,
        certifications: row.certifications,
        languages: row.languages,
        cvLink: row.cvlink,
        notes: row.notes,
        interviewDate: row.interviewdate,
        interviewTime: row.interviewtime,
        interviewer: row.interviewer,
        source: row.source,
        submittedAt: row.submittedat,
        hrNotes: row.hr_notes
      };
    });
    res.json(cvDetails);
  } catch (error: any) {
    console.error('Error fetching CVs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch CVs' });
  }
});

app.post('/api/cvs', async (req, res) => {
  try {
    const { candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, source, submittedAt, hrNotes } = req.body;
    
    await pool.query(
      `INSERT INTO cv_data (candidateid, fullname, email, phone, dateofbirth, address, education, experience, skills, certifications, languages, cvlink, notes, interviewdate, interviewtime, interviewer, source, submittedat, hr_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       ON CONFLICT (candidateid) DO UPDATE SET
       fullname = EXCLUDED.fullname, email = EXCLUDED.email, phone = EXCLUDED.phone, dateofbirth = EXCLUDED.dateofbirth,
       address = EXCLUDED.address, education = EXCLUDED.education, experience = EXCLUDED.experience, skills = EXCLUDED.skills,
       certifications = EXCLUDED.certifications, languages = EXCLUDED.languages, cvlink = EXCLUDED.cvlink, notes = EXCLUDED.notes,
       interviewdate = EXCLUDED.interviewdate, interviewtime = EXCLUDED.interviewtime, interviewer = EXCLUDED.interviewer,
       source = EXCLUDED.source, submittedat = EXCLUDED.submittedat, hr_notes = EXCLUDED.hr_notes`,
      [candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, source, submittedAt, JSON.stringify(hrNotes || [])]
    );

    await pool.query(
      `UPDATE candidates
       SET source = COALESCE($1, source), phone = COALESCE($2, phone), cv_link = COALESCE($3, cv_link),
           interview_date = COALESCE($4, interview_date), interview_time = COALESCE($5, interview_time),
           interviewer = COALESCE($6, interviewer), position = COALESCE($7, position), status = COALESCE($8, status)
       WHERE id = $9`,
      [source || null, phone || null, cvLink || null, interviewDate || null, interviewTime || null, interviewer || null, req.body.position || null, req.body.status || null, candidateId]
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

const PORT = Number(process.env.PORT || 3006);
// Chỉ chạy app.listen nếu không phải môi trường Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });
}

export default app;


app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
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

app.put('/api/users/:email', async (req, res) => {
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

app.delete('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    await pool.query('DELETE FROM users WHERE email = $1', [email.toLowerCase()]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 4. Role Permissions API
app.get('/api/role-permissions', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM role_permissions');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

app.post('/api/role-permissions', async (req, res) => {
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

// ─── RECRUITMENT PLANS API ────────────────────────────────────────────────────────
app.get('/api/recruitment-plans', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM recruitment_plans ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recruitment plans:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch plans' });
  }
});

app.post('/api/recruitment-plans', async (req, res) => {
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

app.put('/api/recruitment-plans/:id', async (req, res) => {
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

app.delete('/api/recruitment-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM recruitment_plans WHERE id = $1', [id]);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    console.error('Error deleting recruitment plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// ─── TASKS API ────────────────────────────────────────────────────────
app.get('/api/tasks', async (req, res) => {
  try {
    const { email, role } = req.query;
    console.log(`[TASKS] Fetching tasks for: ${email} (${role})`);
    if (!email) return res.status(400).json({ error: 'Email query parameter is required' });
    
    let query = '';
    let params: any[] = [];

    if (role === 'Quản trị') {
      query = `SELECT t.*, 
        (SELECT string_agg(user_email, ',') FROM task_assignees WHERE task_id = t.id) as assignees_str 
       FROM tasks t 
       ORDER BY t.created_at DESC`;
    } else {
      const searchEmail = email.toString().toLowerCase();
      query = `SELECT t.*, 
        (SELECT string_agg(user_email, ',') FROM task_assignees WHERE task_id = t.id) as assignees_str 
       FROM tasks t 
       WHERE LOWER(t.assigner_email) = $1 
       OR t.id IN (SELECT task_id FROM task_assignees WHERE LOWER(user_email) = $2)
       ORDER BY t.created_at DESC`;
      params = [searchEmail, searchEmail];
    }

    const { rows } = await pool.query(query, params);
    
    const tasks = (rows as any[]).map(row => ({
      ...row,
      assignees: row.assignees_str ? row.assignees_str.split(',') : (row.assignee_email ? [row.assignee_email] : [])
    }));
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, assigner_email, assignees, status, due_date, task_group, parent_task_id } = req.body;
    
    // Support old API calls that only send assignee_email
    const rawAssignees = assignees || (req.body.assignee_email ? [req.body.assignee_email] : []);
    const finalAssignees = rawAssignees.map((e: string) => e.toLowerCase().trim());
    const finalAssignerEmail = assigner_email.toLowerCase().trim();
    
    if (!title || !finalAssignerEmail || !finalAssignees.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const assignee_email = finalAssignees[0];
    
    const { rows } = await pool.query(
      'INSERT INTO tasks (title, description, assigner_email, assignee_email, status, due_date, task_group, parent_task_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [title, description || '', finalAssignerEmail, assignee_email, status || 'Cần làm', due_date || null, task_group || null, parent_task_id || null]
    );
    const taskId = rows[0].id;
    
    if (finalAssignees.length > 0) {
      for (const email of finalAssignees) {
        await pool.query('INSERT INTO task_assignees (task_id, user_email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [taskId, email]);
      }
    }
    
    res.json({ success: true, message: 'Task created', id: taskId });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignees, status, due_date, result_handover, report_url, task_group, progress } = req.body;
    
    const hasAssignees = Array.isArray(assignees) || Boolean(req.body.assignee_email);
    const rawAssignees = Array.isArray(assignees) ? assignees : (req.body.assignee_email ? [req.body.assignee_email] : []);
    const finalAssignees = rawAssignees.map((e: string) => e.toLowerCase().trim()).filter(Boolean);
    const assignee_email = finalAssignees.length > 0 ? finalAssignees[0] : null;

    await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assignee_email = COALESCE($3, assignee_email),
        status = COALESCE($4, status),
        due_date = COALESCE($5, due_date),
        result_handover = COALESCE($6, result_handover),
        report_url = COALESCE($7, report_url),
        task_group = COALESCE($8, task_group),
        progress = COALESCE($9, progress)
       WHERE id = $10`,
      [
        title ?? null,
        description ?? null,
        assignee_email,
        status ?? null,
        due_date ?? null,
        result_handover ?? null,
        report_url ?? null,
        task_group ?? null,
        progress !== undefined ? progress : null,
        id
      ]
    );

    if (hasAssignees) {
      await pool.query('DELETE FROM task_assignees WHERE task_id = $1', [id]);
      for (const email of finalAssignees) {
        await pool.query('INSERT INTO task_assignees (task_id, user_email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, email]);
      }
    }

    res.json({ success: true, message: 'Task updated' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});


// ─── SUBTASKS API ────────────────────────────────────────────────────
app.get('/api/tasks/:id/subtasks', async (req, res) => {
  try {
    const { id } = req.params;
    // Get child tasks (full tasks linked via parent_task_id)
    const { rows: childTasks } = await pool.query(
      `SELECT t.*, string_agg(ta.user_email, ',' ORDER BY ta.user_email) as assignees_str
       FROM tasks t
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       WHERE t.parent_task_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [id]
    );
    const tasks = (childTasks as any[]).map(row => ({
      ...row,
      type: 'full_task',
      assignees: row.assignees_str ? row.assignees_str.split(',') : []
    }));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

app.post('/api/tasks/:id/subtasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const { rows: resultRows } = await pool.query('INSERT INTO task_subtasks (task_id, title) VALUES ($1, $2) RETURNING id', [id, title]);
    const { rows } = await pool.query('SELECT * FROM task_subtasks WHERE id = $1', [resultRows[0].id]);
    res.json({ success: true, subtask: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

app.put('/api/tasks/subtasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed, title } = req.body;
    await pool.query('UPDATE task_subtasks SET is_completed = COALESCE($1, is_completed), title = COALESCE($2, title) WHERE id = $3', [is_completed !== undefined ? is_completed : null, title || null, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

app.delete('/api/tasks/subtasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM task_subtasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

app.get('/api/tasks/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT c.*, u.name as user_name, u.picture as user_picture 
       FROM task_comments c 
       JOIN users u ON c.user_email = u.email 
       WHERE c.task_id = $1 
       ORDER BY c.created_at ASC`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching task comments:', error);
    res.status(500).json({ error: 'Failed to fetch task comments' });
  }
});

app.post('/api/tasks/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_email, content } = req.body;
    if (!user_email || !content) {
      return res.status(400).json({ error: 'Missing user_email or content' });
    }
    const finalEmail = user_email.toLowerCase().trim();
    const { rows: resultRows } = await pool.query(
      'INSERT INTO task_comments (task_id, user_email, content) VALUES ($1, $2, $3) RETURNING id',
      [id, finalEmail, content]
    );

    
    // Fetch the newly created comment with user details
    const { rows: newCommentRows } = await pool.query(
      `SELECT c.*, u.name as user_name, u.picture as user_picture 
       FROM task_comments c 
       JOIN users u ON c.user_email = u.email 
       WHERE c.id = $1`,
      [resultRows[0].id]
    );
    
    res.json({ success: true, comment: newCommentRows[0] });
  } catch (error) {
    console.error('Error adding task comment:', error);
    res.status(500).json({ error: 'Failed to add task comment' });
  }
});

// ─── TEAMS API ────────────────────────────────────────────────────────────

app.get('/api/teams', async (req, res) => {
  try {
    const { email } = req.query;
    let query = 'SELECT * FROM teams ORDER BY created_at DESC';
    let params: any[] = [];
    
    if (email) {
      query = 'SELECT * FROM teams WHERE owner_email = $1 ORDER BY created_at DESC';
      params.push(email);
    }
    
    const { rows: teams } = await pool.query(query, params);
    const { rows: members } = await pool.query('SELECT * FROM team_members');
    
    const teamsData = teams.map(team => ({
      ...team,
      members: members.filter(m => m.team_id === team.id).map(m => m.user_email)
    }));
    
    res.json(teamsData);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { name, members, owner_email } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!owner_email) return res.status(400).json({ error: 'Owner email is required' });

    const { rows: resultRows } = await pool.query('INSERT INTO teams (name, owner_email) VALUES ($1, $2) RETURNING id', [name, owner_email]);
    const teamId = resultRows[0].id;

    if (members && members.length > 0) {
      for (const email of members) {
        await pool.query('INSERT INTO team_members (team_id, user_email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [teamId, email]);
      }
    }

    res.json({ success: true, message: 'Team created', id: teamId });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

app.put('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, members } = req.body;
    
    if (name) {
      await pool.query('UPDATE teams SET name = $1 WHERE id = $2', [name, id]);
    }
    
    if (members) {
      await pool.query('DELETE FROM team_members WHERE team_id = $1', [id]);
      if (members.length > 0) {
        for (const email of members) {
          await pool.query('INSERT INTO team_members (team_id, user_email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, email]);
        }
      }
    }
    
    res.json({ success: true, message: 'Team updated' });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});


// ─── APP SETTINGS API ────────────────────────────────────────────────────────────

app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM app_settings');
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP',
        [key, value]
      );
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ─── AI TRANSLATE API ────────────────────────────────────────────────────────────

app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, messageId } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const parsedMessageId = messageId ? Number(messageId) : null;
    if (parsedMessageId && Number.isFinite(parsedMessageId)) {
      const { rows: cachedRows } = await pool.query(
        `SELECT ai_translation, ai_translation_language, translated_at
         FROM fb_messages
         WHERE id = $1
           AND ai_translation IS NOT NULL
           AND btrim(ai_translation) <> ''
           AND COALESCE(ai_translation_language, $2) = $2`,
        [parsedMessageId, TRANSLATION_CACHE_LANGUAGE]
      );

      if (cachedRows.length > 0) {
        return res.json({
          translatedText: cachedRows[0].ai_translation,
          cached: true,
          targetLanguage: TRANSLATION_TARGET_LANGUAGE,
          translatedAt: cachedRows[0].translated_at
        });
      }
    }

    // Fetch AI settings
    const { rows } = await pool.query('SELECT * FROM app_settings WHERE key IN ($1, $2, $3)', ['ai_api_key', 'ai_endpoint', 'ai_model']);
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    const apiKey = settings['ai_api_key'];
    const endpoint = settings['ai_endpoint'] || 'https://api.openai.com/v1/chat/completions';
    const model = settings['ai_model'] || 'gpt-3.5-turbo';

    if (!apiKey) {
      return res.status(400).json({ error: 'AI API Key is not configured' });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(buildTranslationRequestBody(endpoint, model, text))
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (e) {}
      throw new Error(`AI API error: ${errorMessage}`);
    }

    const textRes = await response.text();
    let translatedText = '';

    try {
      // Try normal JSON parsing first
      const data = JSON.parse(textRes);
      translatedText = data.choices?.[0]?.message?.content?.trim();
      if (!translatedText && data.answer) {
        translatedText = data.answer.trim(); // Dify direct format
      }
    } catch (e) {
      // If parsing fails, it might be an SSE stream (starts with data: )
      const lines = textRes.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.choices?.[0]?.delta?.content) {
              translatedText += data.choices[0].delta.content;
            } else if (data.choices?.[0]?.message?.content) {
              translatedText += data.choices[0].message.content;
            } else if (data.answer) {
              translatedText += data.answer;
            }
          } catch (err) {}
        }
      }
      translatedText = translatedText.trim();
    }

    if (!translatedText) {
      console.error('AI API Raw Response:', textRes);
      throw new Error('Could not get translation from AI or response format is not supported.');
    }

    if (parsedMessageId && Number.isFinite(parsedMessageId)) {
      await pool.query(
        `UPDATE fb_messages
         SET ai_translation = $1,
             ai_translation_language = $2,
             translated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [translatedText, TRANSLATION_CACHE_LANGUAGE, parsedMessageId]
      );
    }

    res.json({ translatedText, cached: false, targetLanguage: TRANSLATION_TARGET_LANGUAGE });
  } catch (error: any) {
    console.error('AI Translation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to translate' });
  }
});

app.delete('/api/teams/:id', async (req, res) => {

  try {
    const { id } = req.params;
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// --- Accounts API ---
app.get('/api/accounts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM accounts ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { account_type, username, password, email, phone, two_factor, recovery_email, notes } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO accounts (account_type, username, password, email, phone, two_factor, recovery_email, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [account_type, username, password, email, phone, two_factor, recovery_email, notes]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { account_type, username, password, email, phone, two_factor, recovery_email, notes } = req.body;
    const { rows } = await pool.query(
      'UPDATE accounts SET account_type = $1, username = $2, password = $3, email = $4, phone = $5, two_factor = $6, recovery_email = $7, notes = $8 WHERE id = $9 RETURNING *',
      [account_type, username, password, email, phone, two_factor, recovery_email, notes, id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});
