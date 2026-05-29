import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDBUtils, pool } from './db';
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
import aiRoutes from './routes/aiRoutes';
import productRoutes from './routes/productRoutes';
import customerRoutes from './routes/customerRoutes';
import { syncFromSkyMobile } from './services/skymobileSync';

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
app.use('/api/ai', aiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);

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

// ─── BACKGROUND SKY MOBILE SYNC ────────────────────────────────────────────────

const SKY_MOBILE_AUTO_SYNC_INTERVAL_MS = 60 * 60 * 1000;
let isSkyMobileAutoSyncRunning = false;

const runSkyMobileAutoSync = async () => {
  if (isSkyMobileAutoSyncRunning) {
    console.log('[SkyMobile AutoSync] Bỏ qua vì lần đồng bộ trước chưa hoàn tất.');
    return;
  }

  isSkyMobileAutoSyncRunning = true;
  const startedAt = new Date();
  console.log(`[SkyMobile AutoSync] Bắt đầu đồng bộ bổ sung lúc ${startedAt.toISOString()}.`);

  try {
    const result = await syncFromSkyMobile((msg) => {
      console.log(`[SkyMobile AutoSync] ${msg}`);
    }, { mode: 'incremental' });

    if (result.success) {
      console.log(`[SkyMobile AutoSync] Hoàn tất. Đơn: +${result.ordersInserted}/cập nhật ${result.ordersUpdated}; khách: +${result.customersInserted}/cập nhật ${result.customersUpdated}; khuyến mại: +${result.promotionsInserted || 0}/cập nhật ${result.promotionsUpdated || 0}.`);
    } else {
      console.error(`[SkyMobile AutoSync] Thất bại: ${result.error || 'Không rõ lỗi'}`);
    }
  } catch (error: any) {
    console.error('[SkyMobile AutoSync] Lỗi ngoài dự kiến:', error?.message || error);
  } finally {
    isSkyMobileAutoSyncRunning = false;
  }
};

const startSkyMobileAutoSync = () => {
  if (process.env.SKYMOBILE_AUTO_SYNC_DISABLED === 'true') {
    console.log('[SkyMobile AutoSync] Đã tắt qua SKYMOBILE_AUTO_SYNC_DISABLED=true.');
    return;
  }

  console.log('[SkyMobile AutoSync] Đã bật lịch đồng bộ bổ sung mỗi 1 giờ.');
  setInterval(runSkyMobileAutoSync, SKY_MOBILE_AUTO_SYNC_INTERVAL_MS);
};

// ─── EXPORT/START ──────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT || 3006);
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    dbInitPromise
      .then(startSkyMobileAutoSync)
      .catch((err) => console.error('[SkyMobile AutoSync] Không thể khởi động vì DB init lỗi:', err?.message || err));
  });
}

export default app;
