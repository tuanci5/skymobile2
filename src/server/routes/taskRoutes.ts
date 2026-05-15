import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { email, role } = req.query;
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

router.post('/', async (req, res) => {
  try {
    const { title, description, assigner_email, assignees, status, due_date, task_group, parent_task_id } = req.body;
    
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

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignees, status, due_date, result_handover, report_url, task_group, progress } = req.body;
    
    const rawAssignees = assignees || (req.body.assignee_email ? [req.body.assignee_email] : []);
    const finalAssignees = rawAssignees.map((e: string) => e.toLowerCase().trim());
    const assignee_email = finalAssignees.length > 0 ? finalAssignees[0] : null;

    await pool.query(
      'UPDATE tasks SET title = $1, description = $2, assignee_email = COALESCE($3, assignee_email), status = $4, due_date = $5, result_handover = $6, report_url = $7, task_group = $8, progress = COALESCE($9, progress) WHERE id = $10',
      [title, description, assignee_email, status, due_date, result_handover || null, report_url || null, task_group || null, progress !== undefined ? progress : null, id]
    );

    if (finalAssignees && finalAssignees.length > 0) {
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

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// --- Subtasks ---
router.get('/:id/subtasks', async (req, res) => {
  try {
    const { id } = req.params;
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

router.post('/:id/subtasks', async (req, res) => {
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

router.put('/subtasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed, title } = req.body;
    await pool.query('UPDATE task_subtasks SET is_completed = COALESCE($1, is_completed), title = COALESCE($2, title) WHERE id = $3', [is_completed !== undefined ? is_completed : null, title || null, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

router.delete('/subtasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM task_subtasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

// --- Comments ---
router.get('/:id/comments', async (req, res) => {
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

router.post('/:id/comments', async (req, res) => {
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

export default router;
