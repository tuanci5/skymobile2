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
    
    // Normalize snake_case/different casing from DB to camelCase for Frontend
    const normalizedRows = (rows as any[]).map(row => {
      // Create a case-insensitive row getter
      const get = (key: string) => {
        const lowerKey = key.toLowerCase().replace(/_/g, '');
        const foundKey = Object.keys(row).find(k => k.toLowerCase().replace(/_/g, '') === lowerKey);
        return foundKey ? row[foundKey] : undefined;
      };

      return {
        id: get('id'),
        name: get('name'),
        position: get('position'),
        interviewDate: get('interviewdate'),
        interviewTime: get('interviewtime'),
        interviewer: get('interviewer'),
        status: get('status'),
        cvLink: get('cvlink'),
        phone: get('phone'),
        source: get('source'),
        createdAt: get('createdat')
      };
    });
    
    console.log(`GET /api/candidates - Returned ${normalizedRows.length} candidates`);
    res.json(normalizedRows);
  } catch (error) {
    console.error('❌ Error fetching candidates:', error);
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
    console.log('GET /api/cvs - Fetching CV data...');
    const [rows] = await pool.query('SELECT * FROM cv_data');
    const cvDetails: any = {};
    
    (rows as any[]).forEach(row => {
      // Normalize row keys to camelCase to match frontend CVData interface
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        // Simple mapping for common fields
        let normalizedKey = key;
        const lKey = key.toLowerCase();
        if (lKey === 'candidateid') normalizedKey = 'candidateId';
        else if (lKey === 'fullname') normalizedKey = 'fullName';
        else if (lKey === 'dateofbirth') normalizedKey = 'dateOfBirth';
        else if (lKey === 'cvlink') normalizedKey = 'cvLink';
        else if (lKey === 'interviewdate') normalizedKey = 'interviewDate';
        else if (lKey === 'interviewtime') normalizedKey = 'interviewTime';
        else if (lKey === 'hrnotes') normalizedKey = 'hrNotes';
        else if (lKey === 'submittedat') normalizedKey = 'submittedAt';
        
        normalizedRow[normalizedKey] = row[key];
      });

      if (normalizedRow.candidateId) {
        cvDetails[normalizedRow.candidateId] = normalizedRow;
      }
    });
    
    console.log(`GET /api/cvs - Found ${Object.keys(cvDetails).length} CVs`);
    res.json(cvDetails);
  } catch (error) {
    console.error('❌ Error fetching CVs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch CVs' });
  }
});

app.post('/api/cvs', async (req, res) => {
  try {
    const { candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, position, status, hrNotes, submittedAt } = req.body;
    
    console.log(`POST /api/cvs - Saving CV for candidate ${candidateId} (${fullName})`);
    
    // 1. Ensure candidate exists in candidates table (for foreign key constraint)
    const [candidates] = await pool.query('SELECT id FROM candidates WHERE id = ?', [candidateId]);
    if ((candidates as any[]).length === 0) {
      console.log(`POST /api/cvs - Candidate ${candidateId} not in DB. Creating dummy record...`);
      await pool.query(
        'INSERT INTO candidates (id, name, position, status, interview_date, interview_time, interviewer, cv_link, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [candidateId, fullName, position || 'N/A', status || 'Chờ phỏng vấn', interviewDate || null, interviewTime || null, interviewer || 'N/A', cvLink || null, phone || null]
      );
    }

    // 2. Update cv_data table
    await pool.query(
      `INSERT INTO cv_data (candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, position, status, hrNotes, submittedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       fullName = VALUES(fullName), email = VALUES(email), phone = VALUES(phone), dateOfBirth = VALUES(dateOfBirth),
       address = VALUES(address), education = VALUES(education), experience = VALUES(experience), skills = VALUES(skills),
       certifications = VALUES(certifications), languages = VALUES(languages), cvLink = VALUES(cvLink), notes = VALUES(notes),
       interviewDate = VALUES(interviewDate), interviewTime = VALUES(interviewTime), interviewer = VALUES(interviewer),
       position = VALUES(position), status = VALUES(status), hrNotes = VALUES(hrNotes), submittedAt = VALUES(submittedAt)`,
      [candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, position, status, JSON.stringify(hrNotes || []), submittedAt]
    );

    // 3. Update basic candidate info in candidates table
    await pool.query(
      `UPDATE candidates SET name = ?, phone = ?, position = ?, status = ?, interview_date = ?, interview_time = ?, interviewer = ?, cv_link = ? WHERE id = ?`,
      [fullName, phone, position, status, interviewDate, interviewTime, interviewer, cvLink, candidateId]
    );

    console.log(`POST /api/cvs - Success for ${candidateId}`);
    res.json({ success: true, message: 'CV saved and candidate updated' });
  } catch (error) {
    console.error('❌ Error saving CV:', error);
    res.status(500).json({ error: 'Failed to save CV: ' + error.message });
  }
});

// --- Authentication Endpoints ---

// 1. Verify user from database
app.get('/api/auth/verify', async (req: express.Request, res: express.Response) => {
  const email = (req.query.email as string)?.toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as any[];

    if (users.length > 0) {
      res.json({ authorized: true, user: users[0] });
    } else {
      res.json({ authorized: false });
    }
  } catch (error) {
    console.error('❌ Error verifying user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// 2. Sync users from Google Sheet CSV to Database
// This is an admin-only tool (could be triggered manually or via cron)
app.post('/api/auth/sync', async (req: express.Request, res: express.Response) => {
  const { csvUrl } = req.body;
  if (!csvUrl) return res.status(400).json({ error: 'csvUrl is required' });

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(csvUrl);
    const csvData = await response.text();

    const lines = csvData.split('\n')
      .map(line => line.split(','))
      .filter(row => row[0] && row[0].includes('@'));

    let count = 0;
    for (const row of lines) {
      const email = row[0].trim().toLowerCase();
      const role = row[1]?.trim() || 'Thành viên';
      const name = email.split('@')[0]; // Default name from email

      await pool.query(
        'INSERT INTO users (email, name, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
        [email, name, role]
      );
      count++;
    }

    res.json({ success: true, message: `Synced ${count} users to database` });
  } catch (error) {
    console.error('❌ Error syncing users:', error);
    res.status(500).json({ error: 'Sync failed: ' + error.message });
  }
});

// 3. User CRUD for Management
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, name, role, permissions, manager_email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    await pool.query(
      'INSERT INTO users (email, name, role, permissions, manager_email) VALUES (?, ?, ?, ?, ?)',
      [email.toLowerCase(), name || email.split('@')[0], role || 'Thành viên', JSON.stringify(permissions || []), manager_email || null]
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
    const { name, role, permissions, manager_email } = req.body;
    await pool.query(
      'UPDATE users SET name = ?, role = ?, permissions = ?, manager_email = ? WHERE email = ?',
      [name, role, JSON.stringify(permissions || []), manager_email || null, email.toLowerCase()]
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
    await pool.query('DELETE FROM users WHERE email = ?', [email.toLowerCase()]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 4. Role Permissions API
app.get('/api/role-permissions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM role_permissions');
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
      'INSERT INTO role_permissions (role, allowed_tabs) VALUES (?, ?) ON DUPLICATE KEY UPDATE allowed_tabs = ?',
      [role, JSON.stringify(allowed_tabs), JSON.stringify(allowed_tabs)]
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
    const [rows] = await pool.query('SELECT * FROM recruitment_plans ORDER BY created_at DESC');
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
      'INSERT INTO recruitment_plans (position, target_quantity, note, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
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
      'UPDATE recruitment_plans SET position = ?, target_quantity = ?, note = ?, status = ?, start_date = ?, end_date = ? WHERE id = ?',
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
    await pool.query('DELETE FROM recruitment_plans WHERE id = ?', [id]);
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
    if (!email) return res.status(400).json({ error: 'Email query parameter is required' });
    
    let query = '';
    let params: any[] = [];

    if (role === 'Quản trị') {
      query = `SELECT t.*, 
        (SELECT GROUP_CONCAT(user_email) FROM task_assignees WHERE task_id = t.id) as assignees_str 
       FROM tasks t 
       ORDER BY t.created_at DESC`;
    } else {
      query = `SELECT t.*, 
        (SELECT GROUP_CONCAT(user_email) FROM task_assignees WHERE task_id = t.id) as assignees_str 
       FROM tasks t 
       WHERE t.assigner_email = ? 
       OR t.id IN (SELECT task_id FROM task_assignees WHERE user_email = ?)
       ORDER BY t.created_at DESC`;
      params = [email, email];
    }

    const [rows] = await pool.query(query, params);
    
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
    const finalAssignees = assignees || (req.body.assignee_email ? [req.body.assignee_email] : []);
    
    if (!title || !assigner_email || !finalAssignees.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const assignee_email = finalAssignees[0];
    
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, assigner_email, assignee_email, status, due_date, task_group, parent_task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', assigner_email, assignee_email, status || 'Cần làm', due_date || null, task_group || null, parent_task_id || null]
    );
    const taskId = (result as any).insertId;
    
    if (finalAssignees.length > 0) {
      const values = finalAssignees.map((email: string) => [taskId, email]);
      await pool.query('INSERT IGNORE INTO task_assignees (task_id, user_email) VALUES ?', [values]);
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
    
    const finalAssignees = assignees || (req.body.assignee_email ? [req.body.assignee_email] : []);
    const assignee_email = finalAssignees.length > 0 ? finalAssignees[0] : null;

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, assignee_email = COALESCE(?, assignee_email), status = ?, due_date = ?, result_handover = ?, report_url = ?, task_group = ?, progress = COALESCE(?, progress) WHERE id = ?',
      [title, description, assignee_email, status, due_date, result_handover || null, report_url || null, task_group || null, progress !== undefined ? progress : null, id]
    );

    if (finalAssignees && finalAssignees.length > 0) {
      await pool.query('DELETE FROM task_assignees WHERE task_id = ?', [id]);
      const values = finalAssignees.map((email: string) => [id, email]);
      await pool.query('INSERT IGNORE INTO task_assignees (task_id, user_email) VALUES ?', [values]);
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
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
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
    const [childTasks] = await pool.query(
      `SELECT t.*, GROUP_CONCAT(ta.user_email ORDER BY ta.user_email SEPARATOR ',') as assignees_str
       FROM tasks t
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       WHERE t.parent_task_id = ?
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
    const [result] = await pool.query('INSERT INTO task_subtasks (task_id, title) VALUES (?, ?)', [id, title]);
    const [rows] = await pool.query('SELECT * FROM task_subtasks WHERE id = ?', [(result as any).insertId]);
    res.json({ success: true, subtask: (rows as any[])[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

app.put('/api/tasks/subtasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed, title } = req.body;
    await pool.query('UPDATE task_subtasks SET is_completed = COALESCE(?, is_completed), title = COALESCE(?, title) WHERE id = ?', [is_completed !== undefined ? is_completed : null, title || null, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

app.delete('/api/tasks/subtasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM task_subtasks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

app.get('/api/tasks/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT c.*, u.name as user_name, u.picture as user_picture 
       FROM task_comments c 
       JOIN users u ON c.user_email = u.email 
       WHERE c.task_id = ? 
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

    const [result] = await pool.query(
      'INSERT INTO task_comments (task_id, user_email, content) VALUES (?, ?, ?)',
      [id, user_email, content]
    );
    
    // Fetch the newly created comment with user details
    const [newCommentRows] = await pool.query(
      `SELECT c.*, u.name as user_name, u.picture as user_picture 
       FROM task_comments c 
       JOIN users u ON c.user_email = u.email 
       WHERE c.id = ?`,
      [(result as any).insertId]
    );
    
    res.json({ success: true, comment: (newCommentRows as any[])[0] });
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
      query = 'SELECT * FROM teams WHERE owner_email = ? ORDER BY created_at DESC';
      params.push(email);
    }
    
    const [teams] = await pool.query(query, params);
    const [members] = await pool.query('SELECT * FROM team_members');
    
    const teamsData = (teams as any[]).map(team => ({
      ...team,
      members: (members as any[]).filter(m => m.team_id === team.id).map(m => m.user_email)
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

    const [result] = await pool.query('INSERT INTO teams (name, owner_email) VALUES (?, ?)', [name, owner_email]);
    const teamId = (result as any).insertId;

    if (members && members.length > 0) {
      const values = members.map((email: string) => [teamId, email]);
      await pool.query('INSERT INTO team_members (team_id, user_email) VALUES ?', [values]);
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
      await pool.query('UPDATE teams SET name = ? WHERE id = ?', [name, id]);
    }
    
    if (members) {
      await pool.query('DELETE FROM team_members WHERE team_id = ?', [id]);
      if (members.length > 0) {
        const values = members.map((email: string) => [id, email]);
        await pool.query('INSERT INTO team_members (team_id, user_email) VALUES ?', [values]);
      }
    }
    
    res.json({ success: true, message: 'Team updated' });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM teams WHERE id = ?', [id]);
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
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
