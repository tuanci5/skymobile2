import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
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

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;
