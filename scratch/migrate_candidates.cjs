const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function migrate() {
  const mysqlConnection = await mysql.createConnection({
    host: 'db1136.movads.vn',
    port: 3306,
    user: 'skymobile',
    password: 'DftX3Bj25DmF4wpn',
    database: 'skymobile'
  });

  const pgPool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const pgClient = await pgPool.connect();

  try {
    console.log("Starting migration...");

    // Fetch from MySQL
    const [candidates] = await mysqlConnection.execute('SELECT * FROM candidates');
    const [cvData] = await mysqlConnection.execute('SELECT * FROM cv_data');
    const [evaluations] = await mysqlConnection.execute('SELECT * FROM evaluations');

    console.log(`Fetched ${candidates.length} candidates, ${cvData.length} cv_data, ${evaluations.length} evaluations from MySQL.`);

    // Insert candidates
    for (const cand of candidates) {
      try {
        await pgClient.query(`
          INSERT INTO candidates (id, name, position, interview_date, interview_time, interviewer, status, cv_link, phone, source, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            position = EXCLUDED.position,
            interview_date = EXCLUDED.interview_date,
            interview_time = EXCLUDED.interview_time,
            interviewer = EXCLUDED.interviewer,
            status = EXCLUDED.status,
            cv_link = EXCLUDED.cv_link,
            phone = EXCLUDED.phone,
            source = EXCLUDED.source
        `, [
          cand.id, cand.name, cand.position, cand.interview_date, cand.interview_time,
          cand.interviewer, cand.status, cand.cv_link, cand.phone, cand.source, cand.created_at
        ]);
      } catch (e) {
        console.error(`Error inserting candidate ${cand.id}:`, e);
      }
    }
    console.log("Migrated candidates.");

    // Insert cv_data
    for (const cv of cvData) {
      try {
        await pgClient.query(`
          INSERT INTO cv_data (
            candidateId, fullName, email, phone, dateOfBirth, address, education, experience,
            skills, certifications, languages, cvLink, notes, interviewDate, interviewTime, interviewer, submittedAt
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (candidateId) DO UPDATE SET
            fullName = EXCLUDED.fullName,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            dateOfBirth = EXCLUDED.dateOfBirth,
            address = EXCLUDED.address,
            education = EXCLUDED.education,
            experience = EXCLUDED.experience,
            skills = EXCLUDED.skills,
            certifications = EXCLUDED.certifications,
            languages = EXCLUDED.languages,
            cvLink = EXCLUDED.cvLink,
            notes = EXCLUDED.notes,
            interviewDate = EXCLUDED.interviewDate,
            interviewTime = EXCLUDED.interviewTime,
            interviewer = EXCLUDED.interviewer,
            submittedAt = EXCLUDED.submittedAt
        `, [
          cv.candidateId, cv.fullName, cv.email, cv.phone, cv.dateOfBirth, cv.address,
          cv.education, cv.experience, cv.skills, cv.certifications, cv.languages, cv.cvLink,
          cv.notes, cv.interviewDate, cv.interviewTime, cv.interviewer, cv.submittedAt
        ]);
      } catch (e) {
        console.error(`Error inserting cv_data for candidate ${cv.candidateId}:`, e);
      }
    }
    console.log("Migrated cv_data.");

    // Insert evaluations
    for (const ev of evaluations) {
      // In PG, scores and notes are JSON, but in MySQL they might be strings.
      // Need to parse if they are strings, otherwise stringify and parse.
      let scores = typeof ev.scores === 'string' ? ev.scores : JSON.stringify(ev.scores);
      let notes = typeof ev.notes === 'string' ? ev.notes : JSON.stringify(ev.notes);

      try {
        await pgClient.query(`
          INSERT INTO evaluations (
            candidateId, scores, notes, totalScore, strengths, weaknesses, decision, salaryNote, submittedAt
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (candidateId) DO UPDATE SET
            scores = EXCLUDED.scores,
            notes = EXCLUDED.notes,
            totalScore = EXCLUDED.totalScore,
            strengths = EXCLUDED.strengths,
            weaknesses = EXCLUDED.weaknesses,
            decision = EXCLUDED.decision,
            salaryNote = EXCLUDED.salaryNote,
            submittedAt = EXCLUDED.submittedAt
        `, [
          ev.candidateId, scores, notes, ev.totalScore, ev.strengths, ev.weaknesses, ev.decision, ev.salaryNote, ev.submittedAt
        ]);
      } catch (e) {
        console.error(`Error inserting evaluation for candidate ${ev.candidateId}:`, e);
      }
    }
    console.log("Migrated evaluations.");
    console.log("Migration complete.");

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    pgClient.release();
    await pgPool.end();
    await mysqlConnection.end();
  }
}

migrate();
