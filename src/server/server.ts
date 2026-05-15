import express from 'express';
import cors from 'cors';
import { initDBUtils } from './db';
import fbMessengerRouter from './fbMessenger';
import authRoutes from './routes/authRoutes';
import candidateRoutes from './routes/candidateRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import cvRoutes from './routes/cvRoutes';
import userRoutes from './routes/userRoutes';
import roleRoutes from './routes/roleRoutes';
import recruitmentRoutes from './routes/recruitmentRoutes';
import taskRoutes from './routes/taskRoutes';
import teamRoutes from './routes/teamRoutes';

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

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/fb', fbMessengerRouter);
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/users', userRoutes);
app.use('/api/role-permissions', roleRoutes);
app.use('/api/recruitment-plans', recruitmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);

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

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Unhandled Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ─── EXPORT/START ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });
}

export default app;
