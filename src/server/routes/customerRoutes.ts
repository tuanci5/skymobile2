import express from 'express';
import { pool } from '../db';
import { syncFromSkyMobile } from '../services/skymobileSync';

const router = express.Router();

// GET /api/customers - Get paginated customers with search & filters
router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const source = String(req.query.source || '').trim();
    const nationality = String(req.query.nationality || '').trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    let queryParts = ['SELECT * FROM customers WHERE 1=1'];
    let countParts = ['SELECT COUNT(*) FROM customers WHERE 1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      queryParts.push(` AND (customer_name ILIKE $${paramIndex} OR phone_number ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR facebook_uid ILIKE $${paramIndex})`);
      countParts.push(` AND (customer_name ILIKE $${paramIndex} OR phone_number ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR facebook_uid ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (source) {
      queryParts.push(` AND source = $${paramIndex}`);
      countParts.push(` AND source = $${paramIndex}`);
      params.push(source);
      paramIndex++;
    }

    if (nationality) {
      queryParts.push(` AND nationality_name = $${paramIndex}`);
      countParts.push(` AND nationality_name = $${paramIndex}`);
      params.push(nationality);
      paramIndex++;
    }

    // Get total count
    const countRes = await pool.query(countParts.join(''), params);
    const total = parseInt(countRes.rows[0].count);

    // Get data
    queryParts.push(` ORDER BY created_at DESC NULLS LAST, id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`);
    params.push(limit, offset);
    
    const { rows } = await pool.query(queryParts.join(''), params);

    res.json({
      customers: rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/stats - Fetch dashboard metrics
router.get('/stats', async (req, res) => {
  try {
    const custCount = await pool.query('SELECT COUNT(*) FROM customers');
    const orderCount = await pool.query('SELECT COUNT(*) FROM orders');
    const revenueRes = await pool.query('SELECT SUM(total_amount), AVG(total_amount), SUM(commission_total) FROM orders');
    const sourceRes = await pool.query('SELECT source, COUNT(*) FROM customers GROUP BY source');
    const nationalityRes = await pool.query('SELECT nationality_name, COUNT(*) FROM customers WHERE nationality_name IS NOT NULL GROUP BY nationality_name ORDER BY count DESC LIMIT 5');

    const totalCustomers = parseInt(custCount.rows[0].count || '0');
    const totalOrders = parseInt(orderCount.rows[0].count || '0');
    const totalRevenue = parseFloat(revenueRes.rows[0].sum || '0');
    const averageOrderValue = parseFloat(revenueRes.rows[0].avg || '0');
    const totalCommission = parseFloat(revenueRes.rows[0].sum_1 || revenueRes.rows[0].sum || '0'); // fallback/commission col

    const sources = sourceRes.rows.map(r => ({
      source: r.source,
      count: parseInt(r.count)
    }));

    const nationalities = nationalityRes.rows.map(r => ({
      nationality: r.nationality_name,
      count: parseInt(r.count)
    }));

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalCommission,
      sources,
      nationalities
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// POST /api/customers/check - Duplication check by facebook_uid, PSID or phone/email
router.post('/check', async (req, res) => {
  try {
    const { facebook_uid, conversation_id, phone, email } = req.body;
    let exists = false;
    let customer: any = null;

    if (facebook_uid) {
      const r = await pool.query('SELECT * FROM customers WHERE facebook_uid = $1 OR conversation_id = $1', [facebook_uid]);
      if (r.rows.length > 0) {
        exists = true;
        customer = r.rows[0];
      }
    }

    if (!exists && conversation_id) {
      const r = await pool.query('SELECT * FROM customers WHERE conversation_id = $1 OR facebook_uid = $1', [conversation_id]);
      if (r.rows.length > 0) {
        exists = true;
        customer = r.rows[0];
      }
    }

    if (!exists && phone) {
      const r = await pool.query('SELECT * FROM customers WHERE phone_number = $1', [phone]);
      if (r.rows.length > 0) {
        exists = true;
        customer = r.rows[0];
      }
    }

    if (!exists && email) {
      const r = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
      if (r.rows.length > 0) {
        exists = true;
        customer = r.rows[0];
      }
    }

    res.json({ exists, customer });
  } catch (error) {
    console.error('Error checking duplicate customer:', error);
    res.status(500).json({ error: 'Failed to check customer duplicate status' });
  }
});

// POST /api/customers - Add a new customer (manual or from Messenger)
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      phone_number,
      email,
      avatar,
      facebook_uid,
      conversation_id,
      nationality_name,
      notes,
      source // 'manual' or 'messenger'
    } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    // Check if customer already exists to prevent duplicate manual adds
    let checkQuery = 'SELECT id FROM customers WHERE 1=2';
    const checkParams: any[] = [];
    let paramIndex = 1;

    if (facebook_uid) {
      checkQuery += ` OR facebook_uid = $${paramIndex}`;
      checkParams.push(facebook_uid);
      paramIndex++;
    }
    if (conversation_id) {
      checkQuery += ` OR conversation_id = $${paramIndex}`;
      checkParams.push(conversation_id);
      paramIndex++;
    }

    if (checkParams.length > 0) {
      const checkRes = await pool.query(checkQuery, checkParams);
      if (checkRes.rows.length > 0) {
        return res.status(409).json({ error: 'Khách hàng này đã tồn tại trong hệ thống.' });
      }
    }

    // Insert
    const { rows } = await pool.query(`
      INSERT INTO customers (
        customer_name, phone_number, email, avatar, facebook_uid, 
        conversation_id, nationality_name, notes, source, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      customer_name,
      phone_number || null,
      email || null,
      avatar || null,
      facebook_uid || null,
      conversation_id || null,
      nationality_name || null,
      notes || null,
      source || 'manual'
    ]);

    res.json(rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// GET /api/orders - Fetch all synced orders
router.get('/orders', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const orderStatus = String(req.query.orderStatus || '').trim();
    const paymentStatus = String(req.query.paymentStatus || '').trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    let queryParts = ['SELECT * FROM orders WHERE 1=1'];
    let countParts = ['SELECT COUNT(*) FROM orders WHERE 1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      queryParts.push(` AND (customer_name ILIKE $${paramIndex} OR customer_id ILIKE $${paramIndex} OR skymobile_order_id::varchar ILIKE $${paramIndex})`);
      countParts.push(` AND (customer_name ILIKE $${paramIndex} OR customer_id ILIKE $${paramIndex} OR skymobile_order_id::varchar ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (orderStatus) {
      queryParts.push(` AND order_status = $${paramIndex}`);
      countParts.push(` AND order_status = $${paramIndex}`);
      params.push(orderStatus);
      paramIndex++;
    }

    if (paymentStatus) {
      queryParts.push(` AND payment_status = $${paramIndex}`);
      countParts.push(` AND payment_status = $${paramIndex}`);
      params.push(paymentStatus);
      paramIndex++;
    }

    // Get total
    const countRes = await pool.query(countParts.join(''), params);
    const total = parseInt(countRes.rows[0].count);

    // Get data
    queryParts.push(` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`);
    params.push(limit, offset);

    const { rows } = await pool.query(queryParts.join(''), params);

    res.json({
      orders: rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/customers/:id/orders - Fetch orders belonging to a customer
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the customer's skymobile id or name
    const custRes = await pool.query('SELECT skymobile_customer_id, customer_name, facebook_uid FROM customers WHERE id = $1', [id]);
    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { skymobile_customer_id, customer_name, facebook_uid } = custRes.rows[0];

    // Find orders by skymobile_customer_id or customer_name
    let orderQuery = 'SELECT * FROM orders WHERE 1=2';
    const params: any[] = [];
    let pIdx = 1;

    if (skymobile_customer_id) {
      orderQuery += ` OR customer_id = $${pIdx}`;
      params.push(String(skymobile_customer_id));
      pIdx++;
    }
    
    if (customer_name) {
      orderQuery += ` OR customer_name = $${pIdx}`;
      params.push(customer_name);
      pIdx++;
    }

    const { rows } = await pool.query(orderQuery + ' ORDER BY created_at DESC', params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

// GET /api/customers/sync - Trigger Playwright Sync (Server-Sent Events)
router.get('/sync', async (req, res) => {
  // Use chunked transfer encoding to stream status logs to the UI!
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendProgress = (msg: string) => {
    res.write(`data: ${JSON.stringify({ status: 'progress', message: msg })}\n\n`);
  };

  try {
    const result = await syncFromSkyMobile((msg) => {
      sendProgress(msg);
    });

    if (result.success) {
      res.write(`data: ${JSON.stringify({ status: 'success', result })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ status: 'error', error: result.error })}\n\n`);
    }
    res.end();
  } catch (error: any) {
    console.error('API sync error:', error);
    res.write(`data: ${JSON.stringify({ status: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
