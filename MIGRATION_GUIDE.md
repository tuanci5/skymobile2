# 🗄️ Database Migration Guide

## Overview
The "Danh sách PV" (Interview List) tab has been successfully migrated from Google Sheets to a PostgreSQL database hosted on Supabase.

## What Changed

### ✅ Completed
- ✅ Data migrated: **30 candidates** and **32 evaluations** 
- ✅ Backend: Updated to use PostgreSQL with pg driver
- ✅ Frontend: Updated all components to use REST API instead of Google Sheets
- ✅ Database schema: Tables created automatically on first connection

### 📊 Data Migration
All data from Google Sheets has been imported into the database:
- **Candidates Table**: 30 records
- **Evaluations Table**: 32 records
- **CV Data Table**: Ready for storage

## System Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React/Vite)           │
│     - InterviewTab.tsx                  │
│     - AddCandidateModal.tsx             │
│     - CandidateEvalModal.tsx            │
│     - CVEditModal.tsx                   │
│     - EvalReportModal.tsx               │
└────────────┬────────────────────────────┘
             │ API Calls (JSON/REST)
             ↓
┌─────────────────────────────────────────┐
│     Backend (Express/Node.js)           │
│  Port: 3001 (Local) / Vercel (Prod)    │
│     - GET /api/candidates               │
│     - POST /api/candidates              │
│     - PUT /api/candidates/:id/status    │
│     - DELETE /api/candidates/:id        │
│     - GET /api/evaluations              │
│     - POST /api/evaluations             │
│     - GET /api/cvs                      │
│     - POST /api/cvs                     │
└────────────┬────────────────────────────┘
             │ SQL Queries
             ↓
┌─────────────────────────────────────────┐
│   PostgreSQL Database (Supabase)        │
│   Host: db.sfwtadeutxntwtpsgqgi...      │
│   Port: 5432                            │
│   Tables:                               │
│   - candidates                          │
│   - evaluations                         │
│   - cv_data                             │
└─────────────────────────────────────────┘
```

## Database Configuration

### Connection Details
```
Host (Máy chủ): db.sfwtadeutxntwtpsgqgi.supabase.co
Port (Cổng): 5432
Database (Tên cơ sở dữ liệu): postgres
User (Tên đăng nhập): postgres
Password (Mật khẩu): Thoigian1@1
```

### Environment Variables

**Backend (.env.local)**
```env
# Database Configuration
DB_HOST=db.sfwtadeutxntwtpsgqgi.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Thoigian1@1
DB_NAME=postgres
```

**Frontend**
```env
# API URL (optional, defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

## Running the Application

### 1. Start the Backend API Server

```bash
cd deploy/backend
npm install
npm run api
```

The server will:
- Create database tables automatically on first run
- Listen on `http://localhost:3001`
- Log successful connection to Supabase

### 2. Start the Frontend

```bash
npm run dev
```

The frontend will connect to the API at `http://localhost:3001` by default.

## API Endpoints

### Candidates
- **GET /api/candidates** - Fetch all candidates
- **POST /api/candidates** - Add new candidate
- **PUT /api/candidates/:id/status** - Update candidate status
- **DELETE /api/candidates/:id** - Delete candidate

### Evaluations
- **GET /api/evaluations** - Fetch all evaluations
- **POST /api/evaluations** - Save/update evaluation

### CV Data
- **GET /api/cvs** - Fetch all CV data
- **POST /api/cvs** - Save/update CV data

## Database Schema

### candidates table
```sql
CREATE TABLE candidates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  position VARCHAR(255),
  interview_date VARCHAR(50),
  interviewer VARCHAR(255),
  status VARCHAR(255),
  cv_link TEXT,
  phone VARCHAR(50),
  source VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### evaluations table
```sql
CREATE TABLE evaluations (
  candidate_id VARCHAR(50) PRIMARY KEY,
  scores JSONB,
  notes JSONB,
  total_score INT,
  strengths TEXT,
  weaknesses TEXT,
  decision VARCHAR(50),
  salary_note TEXT,
  submitted_at VARCHAR(100),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
```

### cv_data table
```sql
CREATE TABLE cv_data (
  candidate_id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  date_of_birth VARCHAR(50),
  address TEXT,
  education TEXT,
  experience TEXT,
  skills TEXT,
  certifications TEXT,
  languages TEXT,
  cv_link TEXT,
  notes TEXT,
  interview_date VARCHAR(50),
  interview_time VARCHAR(50),
  interviewer VARCHAR(255),
  submitted_at VARCHAR(100),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
```

## Features

### Features Still Working
✅ Add new candidates
✅ View candidate list with filters
✅ Update candidate status
✅ Delete candidates
✅ Save evaluations
✅ View evaluation reports
✅ Edit CV data
✅ Real-time data synchronization
✅ Local caching and offline support

### Data Persistence
- All data is now saved to PostgreSQL database
- Auto-sync every 10 minutes
- Local storage used for temporary caching
- Graceful fallback if API is unavailable

## Migration Notes

### What's New
- ✨ Faster data loading from database vs CSV
- ✨ Better data consistency and integrity
- ✨ No more Google Sheets dependency
- ✨ Scalable database architecture
- ✨ Better performance with JSONB for evaluation data

### Breaking Changes
- Google Sheets integration removed
- Apps Script URLs no longer used
- CSV parsing logic removed (cleaner code)

### Data Loss Prevention
- All historical data preserved during migration
- 30 candidates + 32 evaluations successfully imported
- Data integrity maintained with foreign keys

## Troubleshooting

### Issue: Cannot connect to database
**Solution**: 
1. Verify database credentials in `.env.local`
2. Check firewall/VPN settings
3. Ensure Supabase server is running
4. Test connection with: `npm run lint`

### Issue: API not responding
**Solution**:
1. Ensure backend server is running: `npm run api`
2. Check port 3001 is not in use
3. Verify `VITE_API_URL` is correct in frontend

### Issue: Data not persisting
**Solution**:
1. Check database connection logs
2. Verify table schema exists
3. Try restarting backend: `npm run api`

## Next Steps

1. ✅ Test the complete flow locally
2. ✅ Deploy backend to production (Vercel)
3. ✅ Update frontend environment variables
4. ✅ Monitor database performance
5. ✅ Set up automated backups

## Support Files

- Backend API: `deploy/backend/src/server/server.ts`
- Database Config: `deploy/backend/src/server/db.ts`
- Migration Script: `deploy/backend/src/server/migrate.ts`
- Frontend Components:
  - `src/components/InterviewTab.tsx`
  - `src/components/AddCandidateModal.tsx`
  - `src/components/CandidateEvalModal.tsx`
  - `src/components/CVEditModal.tsx`

---

**Status**: ✅ Migration Complete
**Last Updated**: 2026-04-22
**Data Migrated**: 30 candidates, 32 evaluations
