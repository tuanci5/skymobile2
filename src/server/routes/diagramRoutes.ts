import express from 'express';
import { pool } from '../db';

const router = express.Router();

const ensureDiagramTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS diagram_pages (
      id VARCHAR(100) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      sort_order INT DEFAULT 0,
      data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

router.get('/pages', async (_req, res) => {
  try {
    await ensureDiagramTables();
    const { rows } = await pool.query('SELECT id, title, description, sort_order, data, created_at, updated_at FROM diagram_pages ORDER BY sort_order ASC, created_at ASC');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching diagram pages:', error);
    res.status(500).json({ error: 'Failed to fetch diagram pages' });
  }
});

router.post('/pages', async (req, res) => {
  try {
    await ensureDiagramTables();
    const { id, title, description, sort_order, data } = req.body;
    const pageId = id || `page-${Date.now()}`;
    const { rows } = await pool.query(
      `INSERT INTO diagram_pages (id, title, description, sort_order, data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         sort_order = EXCLUDED.sort_order,
         data = EXCLUDED.data,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [pageId, title || 'Sơ đồ mới', description || '', sort_order || 0, JSON.stringify(data || {})]
    );
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error saving diagram page:', error);
    res.status(500).json({ error: 'Failed to save diagram page' });
  }
});

router.put('/pages/:id', async (req, res) => {
  try {
    await ensureDiagramTables();
    const { id } = req.params;
    const { title, description, sort_order, data } = req.body;
    const { rows } = await pool.query(
      `UPDATE diagram_pages
       SET title = $1, description = $2, sort_order = $3, data = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title || 'Sơ đồ', description || '', sort_order || 0, JSON.stringify(data || {}), id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Diagram page not found' });
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error updating diagram page:', error);
    res.status(500).json({ error: 'Failed to update diagram page' });
  }
});

router.delete('/pages/:id', async (req, res) => {
  try {
    await ensureDiagramTables();
    const { id } = req.params;
    await pool.query('DELETE FROM diagram_pages WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting diagram page:', error);
    res.status(500).json({ error: 'Failed to delete diagram page' });
  }
});

export default router;
