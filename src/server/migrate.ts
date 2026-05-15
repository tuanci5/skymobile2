import dotenv from 'dotenv';
import path from 'path';
import { pool, initDBUtils } from './db.js';

// Load environment variables
if (!process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const SHEET_CSV_URL = process.env.VITE_SHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuRx9hqGe3Ln2ub2wUOYZCX_V6dhb3vK5rSKF1GA84E2y2UG8GignyKlU3QEHtLjXv-xhI4KnVbSCV/pub?output=csv';
const RESULT_SHEET_CSV_URL = process.env.VITE_RESULT_SHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuRx9hqGe3Ln2ub2wUOYZCX_V6dhb3vK5rSKF1GA84E2y2UG8GignyKlU3QEHtLjXv-xhI4KnVbSCV/pub?gid=483749081&single=true&output=csv';

const parseCSVRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
};

async function migrateCandidates() {
  console.log('📥 Fetching candidates from Google Sheets...');
  try {
    const response = await fetch(SHEET_CSV_URL);
    const text = await response.text();
    const rows = text.split('\n').map(parseCSVRow);
    
    // Header: 0:id, 1:name, 2:position, 3:date, 4:interviewer, 5:status, 6:cv, 7:phone, 8:source
    const candidates = rows.slice(1)
      .filter(row => row.length >= 6 && row[0])
      .map(row => ({
        id: row[0],
        name: row[1],
        position: row[2],
        interviewDate: row[3],
        interviewer: row[4],
        status: row[5],
        cvLink: row[6] || undefined,
        phone: row[7] || '',
        source: row[8] || ''
      }));

    console.log(`Found ${candidates.length} candidates. Inserting into database...`);
    
    let insertedCount = 0;
    for (const candidate of candidates) {
      try {
        await pool.query(
          `INSERT INTO candidates (id, name, position, interview_date, interviewer, status, cv_link, phone, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, position = EXCLUDED.position, interview_date = EXCLUDED.interview_date,
           interviewer = EXCLUDED.interviewer, status = EXCLUDED.status, cv_link = EXCLUDED.cv_link,
           phone = EXCLUDED.phone, source = EXCLUDED.source`,
          [candidate.id, candidate.name, candidate.position, candidate.interviewDate, 
           candidate.interviewer, candidate.status, candidate.cvLink, candidate.phone, candidate.source]
        );
        insertedCount++;
      } catch (err) {
        console.warn(`Failed to insert candidate ${candidate.id}:`, err.message);
      }
    }
    
    console.log(`✅ Successfully inserted/updated ${insertedCount} candidates`);
    return insertedCount;
  } catch (err) {
    console.error('❌ Error migrating candidates:', err);
    throw err;
  }
}

async function migrateEvaluations() {
  console.log('📥 Fetching evaluations from Google Sheets...');
  try {
    const response = await fetch(RESULT_SHEET_CSV_URL);
    const text = await response.text();
    const rows = text.split('\n').map(parseCSVRow);
    
    const evaluations: any[] = [];
    rows.slice(1).forEach(row => {
      if (row.length < 10) return;
      const candidateId = row[1];
      if (!candidateId) return;

      try {
        const scores: Record<string, number> = {};
        const critIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12'];
        critIds.forEach((id, i) => {
          scores[id] = parseInt(row[10 + i] || '0');
        });

        const notes: Record<string, string> = {};
        critIds.forEach((id, i) => {
          notes[id] = row[22 + i] || '';
        });

        evaluations.push({
          candidateId,
          scores,
          notes,
          totalScore: parseInt(row[5] || '0'),
          strengths: row[6],
          weaknesses: row[7],
          decision: row[8],
          salaryNote: row[9],
          submittedAt: row[0]
        });
      } catch(e) {
        console.warn('Error parsing evaluation for candidate', candidateId);
      }
    });

    console.log(`Found ${evaluations.length} evaluations. Inserting into database...`);
    
    let insertedCount = 0;
    for (const eval_data of evaluations) {
      try {
        await pool.query(
          `INSERT INTO evaluations (candidate_id, scores, notes, total_score, strengths, weaknesses, decision, salary_note, submitted_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (candidate_id) DO UPDATE SET
           scores = EXCLUDED.scores, notes = EXCLUDED.notes, total_score = EXCLUDED.total_score,
           strengths = EXCLUDED.strengths, weaknesses = EXCLUDED.weaknesses, decision = EXCLUDED.decision,
           salary_note = EXCLUDED.salary_note, submitted_at = EXCLUDED.submitted_at`,
          [eval_data.candidateId, JSON.stringify(eval_data.scores), JSON.stringify(eval_data.notes), 
           eval_data.totalScore, eval_data.strengths, eval_data.weaknesses, eval_data.decision, 
           eval_data.salaryNote, eval_data.submittedAt]
        );
        insertedCount++;
      } catch (err) {
        console.warn(`Failed to insert evaluation for ${eval_data.candidateId}:`, err.message);
      }
    }
    
    console.log(`✅ Successfully inserted/updated ${insertedCount} evaluations`);
    return insertedCount;
  } catch (err) {
    console.error('❌ Error migrating evaluations:', err);
    throw err;
  }
}

async function runMigration() {
  console.log('🚀 Starting data migration from Google Sheets to Database...\n');
  
  try {
    console.log('📋 Initializing database schema...');
    await initDBUtils();
    console.log('✅ Database schema ready\n');
    
    const candidateCount = await migrateCandidates();
    console.log('');
    const evaluationCount = await migrateEvaluations();
    
    console.log('\n✨ Migration completed successfully!');
    console.log(`Total: ${candidateCount} candidates, ${evaluationCount} evaluations`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

// Run migration
runMigration().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
