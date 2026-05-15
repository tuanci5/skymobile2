import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
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
        submittedAt: row.submittedat
      };
    });
    res.json(cvDetails);
  } catch (error: any) {
    console.error('Error fetching CVs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch CVs' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, source, submittedAt } = req.body;
    
    await pool.query(
      `INSERT INTO cv_data (candidateid, fullname, email, phone, dateofbirth, address, education, experience, skills, certifications, languages, cvlink, notes, interviewdate, interviewtime, interviewer, source, submittedat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (candidateid) DO UPDATE SET
       fullname = EXCLUDED.fullname, email = EXCLUDED.email, phone = EXCLUDED.phone, dateofbirth = EXCLUDED.dateofbirth,
       address = EXCLUDED.address, education = EXCLUDED.education, experience = EXCLUDED.experience, skills = EXCLUDED.skills,
       certifications = EXCLUDED.certifications, languages = EXCLUDED.languages, cvlink = EXCLUDED.cvlink, notes = EXCLUDED.notes,
       interviewdate = EXCLUDED.interviewdate, interviewtime = EXCLUDED.interviewtime, interviewer = EXCLUDED.interviewer,
       source = EXCLUDED.source, submittedat = EXCLUDED.submittedat`,
      [candidateId, fullName, email, phone, dateOfBirth, address, education, experience, skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, source, submittedAt]
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

export default router;
