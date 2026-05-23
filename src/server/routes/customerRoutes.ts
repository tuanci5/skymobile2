import express from 'express';
import { pool } from '../db';
import { syncFromSkyMobile } from '../services/skymobileSync';

const router = express.Router();

type RevenueReportRange = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeReportRange = (range: unknown): RevenueReportRange => {
  const normalized = String(range || 'month')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()
    .toLowerCase();

  if (normalized === 'today' || normalized.includes('hom nay')) return 'today';
  if (normalized === 'yesterday' || normalized.includes('hom qua')) return 'yesterday';
  if (normalized === 'week' || normalized.includes('tuan nay')) return 'week';
  if (normalized === 'year' || normalized.includes('nam nay')) return 'year';
  if (normalized === 'custom' || normalized.includes('khoang ngay')) return 'custom';
  return 'month';
};

const getRevenueReportConfig = (range: RevenueReportRange, startDate?: unknown, endDate?: unknown) => {
  const now = "timezone('Asia/Ho_Chi_Minh', now())";
  const customStartDate = String(startDate || '').trim();
  const customEndDate = String(endDate || '').trim();

  switch (range) {
    case 'custom':
      if (!ISO_DATE_PATTERN.test(customStartDate) || !ISO_DATE_PATTERN.test(customEndDate)) {
        throw new Error('Khoảng ngày không hợp lệ.');
      }
      return {
        range,
        currentStartSql: `'${customStartDate}'::date`,
        currentEndSql: `'${customEndDate}'::date + interval '1 day'`,
        previousStartSql: `'${customStartDate}'::date - ((('${customEndDate}'::date + interval '1 day') - '${customStartDate}'::date))`,
        seriesStep: '1 day',
        truncUnit: 'day',
        labelFormat: 'DD/MM'
      };
    case 'today':
      return {
        range,
        currentStartSql: `date_trunc('day', ${now})`,
        currentEndSql: now,
        previousStartSql: `date_trunc('day', ${now}) - interval '1 day'`,
        seriesStep: '1 hour',
        truncUnit: 'hour',
        labelFormat: 'HH24:MI'
      };
    case 'yesterday':
      return {
        range,
        currentStartSql: `date_trunc('day', ${now}) - interval '1 day'`,
        currentEndSql: `date_trunc('day', ${now})`,
        previousStartSql: `date_trunc('day', ${now}) - interval '2 days'`,
        seriesStep: '1 hour',
        truncUnit: 'hour',
        labelFormat: 'HH24:MI'
      };
    case 'week':
      return {
        range,
        currentStartSql: `date_trunc('week', ${now})`,
        currentEndSql: now,
        previousStartSql: `date_trunc('week', ${now}) - interval '1 week'`,
        seriesStep: '1 day',
        truncUnit: 'day',
        labelFormat: 'DD/MM'
      };
    case 'year':
      return {
        range,
        currentStartSql: `date_trunc('year', ${now})`,
        currentEndSql: now,
        previousStartSql: `date_trunc('year', ${now}) - interval '1 year'`,
        seriesStep: '1 month',
        truncUnit: 'month',
        labelFormat: 'MM/YYYY'
      };
    case 'month':
    default:
      return {
        range: 'month' as const,
        currentStartSql: `date_trunc('month', ${now})`,
        currentEndSql: now,
        previousStartSql: `date_trunc('month', ${now}) - interval '1 month'`,
        seriesStep: '1 day',
        truncUnit: 'day',
        labelFormat: 'DD/MM'
      };
  }
};

const buildRevenueBoundsCte = (config: ReturnType<typeof getRevenueReportConfig>) => `
  bounds AS (
    SELECT
      ${config.currentStartSql} AS current_start,
      ${config.currentEndSql} AS current_end,
      ${config.previousStartSql} AS previous_start,
      ${config.previousStartSql} + (${config.currentEndSql} - ${config.currentStartSql}) AS previous_end
  )
`;

const toFloat = (value: unknown) => Number.parseFloat(String(value || '0')) || 0;
const toInt = (value: unknown) => Number.parseInt(String(value || '0'), 10) || 0;

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

// GET /api/customers/debts - Customer debt overview grouped by customer
router.get('/debts', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const paymentStatus = String(req.query.paymentStatus || '').trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let paramIndex = 1;

    const debtWhereParts = [
      `COALESCE(o.total_amount, 0) > 0`,
      `COALESCE(o.payment_status, 'Unpaid') <> 'Paid'`,
      `COALESCE(o.order_status, '') NOT IN ('Cancelled', 'Canceled')`,
      `COALESCE(o.approval_status, '') <> 'Rejected'`
    ];

    if (search) {
      debtWhereParts.push(`(o.customer_name ILIKE $${paramIndex} OR o.customer_id ILIKE $${paramIndex} OR o.skymobile_order_id::varchar ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (paymentStatus) {
      debtWhereParts.push(`COALESCE(o.payment_status, 'Unpaid') = $${paramIndex}`);
      params.push(paymentStatus);
      paramIndex++;
    }

    const whereSql = debtWhereParts.join(' AND ');

    const summaryRes = await pool.query(`
      SELECT
        COUNT(*)::int AS debt_order_count,
        COUNT(DISTINCT COALESCE(NULLIF(o.customer_id, ''), o.customer_name, o.id::text))::int AS debt_customer_count,
        COALESCE(SUM(COALESCE(o.total_amount, 0)), 0) AS total_debt,
        COALESCE(SUM(COALESCE(o.total_amount, 0)) FILTER (WHERE o.created_at < CURRENT_DATE - interval '30 days'), 0) AS overdue_debt
      FROM orders o
      WHERE ${whereSql}
    `, params);

    const countRes = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT COALESCE(NULLIF(o.customer_id, ''), o.customer_name, o.id::text)
        FROM orders o
        WHERE ${whereSql}
        GROUP BY COALESCE(NULLIF(o.customer_id, ''), o.customer_name, o.id::text)
      ) grouped
    `, params);

    const listParams = [...params, limit, offset];
    const { rows } = await pool.query(`
      WITH debt_orders AS (
        SELECT o.*
        FROM orders o
        WHERE ${whereSql}
      ), grouped AS (
        SELECT
          COALESCE(NULLIF(o.customer_id, ''), o.customer_name, o.id::text) AS customer_key,
          MAX(c.id) AS customer_local_id,
          MAX(c.skymobile_customer_id) AS skymobile_customer_id,
          COALESCE(MAX(c.customer_name), MAX(o.customer_name), 'Khách chưa xác định') AS customer_name,
          MAX(COALESCE(c.avatar, o.customer_avatar)) AS customer_avatar,
          MAX(c.phone_number) AS phone_number,
          MAX(c.email) AS email,
          COUNT(o.id)::int AS debt_order_count,
          COALESCE(SUM(COALESCE(o.total_amount, 0)), 0) AS total_debt,
          MIN(o.created_at) AS oldest_debt_at,
          MAX(o.created_at) AS latest_order_at,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', o.id,
              'skymobile_order_id', o.skymobile_order_id,
              'customer_id', o.customer_id,
              'customer_name', o.customer_name,
              'branch_name', o.branch_name,
              'created_by_name', o.created_by_name,
              'order_status', o.order_status,
              'approval_status', o.approval_status,
              'payment_status', o.payment_status,
              'fulfillment_status', o.fulfillment_status,
              'total_amount', o.total_amount,
              'created_at', o.created_at,
              'product_quantity', o.product_quantity
            ) ORDER BY o.created_at DESC NULLS LAST
          ) AS orders
        FROM debt_orders o
        LEFT JOIN customers c ON (
          (NULLIF(o.customer_id, '') IS NOT NULL AND c.skymobile_customer_id::text = o.customer_id)
          OR (o.customer_name IS NOT NULL AND c.customer_name = o.customer_name)
        )
        GROUP BY COALESCE(NULLIF(o.customer_id, ''), o.customer_name, o.id::text)
      )
      SELECT *
      FROM grouped
      ORDER BY total_debt DESC, latest_order_at DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, listParams);

    const total = toInt(countRes.rows[0]?.count);
    res.json({
      summary: {
        totalDebt: toFloat(summaryRes.rows[0]?.total_debt),
        overdueDebt: toFloat(summaryRes.rows[0]?.overdue_debt),
        debtOrderCount: toInt(summaryRes.rows[0]?.debt_order_count),
        debtCustomerCount: toInt(summaryRes.rows[0]?.debt_customer_count)
      },
      debts: rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Error fetching customer debts:', error);
    res.status(500).json({ error: 'Failed to fetch customer debts', details: error.message });
  }
});

// GET /api/customers/revenue-report - Revenue report backed by real orders/customers data
router.get('/revenue-report', async (req, res) => {
  try {
    const range = normalizeReportRange(req.query.range);
    const config = getRevenueReportConfig(range, req.query.startDate, req.query.endDate);
    const boundsCte = buildRevenueBoundsCte(config);

    const metricsRes = await pool.query(`
      WITH ${boundsCte},
      order_metrics AS (
        SELECT
          COALESCE(SUM(COALESCE(o.total_amount, 0)) FILTER (WHERE o.created_at >= b.current_start AND o.created_at < b.current_end), 0) AS current_revenue,
          COALESCE(SUM(COALESCE(o.total_amount, 0)) FILTER (WHERE o.created_at >= b.previous_start AND o.created_at < b.previous_end), 0) AS previous_revenue,
          COUNT(o.id) FILTER (WHERE o.created_at >= b.current_start AND o.created_at < b.current_end) AS current_orders,
          COUNT(o.id) FILTER (WHERE o.created_at >= b.previous_start AND o.created_at < b.previous_end) AS previous_orders
        FROM bounds b
        LEFT JOIN orders o
          ON o.created_at >= b.previous_start
          AND o.created_at < b.current_end
      ),
      customer_metrics AS (
        SELECT
          COUNT(c.id) FILTER (WHERE c.created_at >= b.current_start AND c.created_at < b.current_end) AS current_customers,
          COUNT(c.id) FILTER (WHERE c.created_at >= b.previous_start AND c.created_at < b.previous_end) AS previous_customers
        FROM bounds b
        LEFT JOIN customers c
          ON c.created_at >= b.previous_start
          AND c.created_at < b.current_end
      )
      SELECT * FROM order_metrics, customer_metrics
    `);

    const chartRes = await pool.query(`
      WITH ${boundsCte},
      series AS (
        SELECT generate_series(
          b.current_start,
          date_trunc('${config.truncUnit}', b.current_end),
          interval '${config.seriesStep}'
        ) AS bucket
        FROM bounds b
      ),
      order_buckets AS (
        SELECT
          date_trunc('${config.truncUnit}', o.created_at) AS bucket,
          COALESCE(SUM(COALESCE(o.total_amount, 0)), 0) AS revenue,
          COUNT(o.id) AS orders
        FROM bounds b
        JOIN orders o
          ON o.created_at >= b.current_start
          AND o.created_at < b.current_end
        GROUP BY 1
      )
      SELECT
        to_char(s.bucket, '${config.labelFormat}') AS label,
        COALESCE(ob.revenue, 0) AS revenue,
        COALESCE(ob.orders, 0) AS orders
      FROM series s
      LEFT JOIN order_buckets ob ON ob.bucket = s.bucket
      ORDER BY s.bucket
    `);

    const topProductsRes = await pool.query(`
      WITH ${boundsCte}
      SELECT
        COALESCE(NULLIF(oi.product_name, ''), 'Không rõ sản phẩm') AS name,
        COUNT(DISTINCT o.id) AS sales,
        COALESCE(SUM(COALESCE(oi.selling_price, 0) * GREATEST(COALESCE(oi.quantity, 1), 1)), 0) AS revenue
      FROM bounds b
      JOIN orders o
        ON o.created_at >= b.current_start
        AND o.created_at < b.current_end
      JOIN order_items oi ON oi.order_id = o.skymobile_order_id
      GROUP BY 1
      ORDER BY revenue DESC, sales DESC, name ASC
      LIMIT 6
    `);

    const recentOrdersRes = await pool.query(`
      WITH ${boundsCte}
      SELECT
        o.id,
        o.skymobile_order_id,
        COALESCE(NULLIF(o.customer_name, ''), 'Khách hàng') AS customer,
        COALESCE((
          SELECT string_agg(NULLIF(oi.product_name, ''), ', ' ORDER BY oi.id)
          FROM order_items oi
          WHERE oi.order_id = o.skymobile_order_id
        ), '-') AS product,
        COALESCE(o.total_amount, 0) AS amount,
        COALESCE(o.approval_status, o.order_status, 'Pending') AS status,
        o.created_at AS date
      FROM bounds b
      JOIN orders o
        ON o.created_at >= b.current_start
        AND o.created_at < b.current_end
      ORDER BY o.created_at DESC NULLS LAST, o.id DESC
      LIMIT 8
    `);

    const metrics = metricsRes.rows[0] || {};
    const currentRevenue = toFloat(metrics.current_revenue);
    const previousRevenue = toFloat(metrics.previous_revenue);
    const currentOrders = toInt(metrics.current_orders);
    const previousOrders = toInt(metrics.previous_orders);
    const currentCustomers = toInt(metrics.current_customers);
    const previousCustomers = toInt(metrics.previous_customers);
    const currentAverageOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const previousAverageOrderValue = previousOrders > 0 ? previousRevenue / previousOrders : 0;
    const currentConversion = currentCustomers > 0 ? (currentOrders / currentCustomers) * 100 : 0;
    const previousConversion = previousCustomers > 0 ? (previousOrders / previousCustomers) * 100 : 0;

    const rawTopProducts = topProductsRes.rows.map(row => ({
      name: row.name,
      sales: toInt(row.sales),
      revenue: toFloat(row.revenue)
    }));
    const maxProductRevenue = Math.max(0, ...rawTopProducts.map(item => item.revenue));
    const maxProductSales = Math.max(0, ...rawTopProducts.map(item => item.sales));
    const topProducts = rawTopProducts.map(item => ({
      ...item,
      percent: maxProductRevenue > 0
        ? Math.round((item.revenue / maxProductRevenue) * 100)
        : maxProductSales > 0
          ? Math.round((item.sales / maxProductSales) * 100)
          : 0
    }));

    res.json({
      range: config.range,
      summary: {
        revenue: { current: currentRevenue, previous: previousRevenue },
        orders: { current: currentOrders, previous: previousOrders },
        customers: { current: currentCustomers, previous: previousCustomers },
        averageOrderValue: {
          current: Number(currentAverageOrderValue.toFixed(0)),
          previous: Number(previousAverageOrderValue.toFixed(0))
        },
        conversion: {
          current: Number(currentConversion.toFixed(1)),
          previous: Number(previousConversion.toFixed(1))
        }
      },
      chart: chartRes.rows.map(row => ({
        label: row.label,
        revenue: toFloat(row.revenue),
        orders: toInt(row.orders)
      })),
      topProducts,
      recentOrders: recentOrdersRes.rows.map(row => ({
        id: row.skymobile_order_id ? `#${row.skymobile_order_id}` : `#${row.id}`,
        customer: row.customer,
        product: row.product,
        amount: toFloat(row.amount),
        status: row.status,
        date: row.date
      }))
    });
  } catch (error: any) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ error: 'Failed to fetch revenue report', details: error.message });
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
    const approvalStatus = String(req.query.approvalStatus || '').trim();
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

    if (approvalStatus) {
      queryParts.push(` AND COALESCE(approval_status, order_status, 'Pending') = $${paramIndex}`);
      countParts.push(` AND COALESCE(approval_status, order_status, 'Pending') = $${paramIndex}`);
      params.push(approvalStatus);
      paramIndex++;
    }

    // Get total
    const countRes = await pool.query(countParts.join(''), params);
    const total = parseInt(countRes.rows[0].count);

    // Get data
    queryParts.push(` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`);
    params.push(limit, offset);

    const { rows } = await pool.query(queryParts.join(''), params);

    // Fetch and group related product items for the returned orders
    if (rows.length > 0) {
      const orderIds = rows.map(r => r.skymobile_order_id);
      const itemsRes = await pool.query(
        'SELECT * FROM order_items WHERE order_id = ANY($1)',
        [orderIds]
      );
      
      const itemsByOrderId: Record<number, any[]> = {};
      for (const item of itemsRes.rows) {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        itemsByOrderId[item.order_id].push(item);
      }
      
      for (const order of rows) {
        order.items = itemsByOrderId[order.skymobile_order_id] || [];
      }
    }

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

// GET /api/customers/lookup - Look up a customer by skymobile_customer_id or customer_name
router.get('/lookup', async (req, res) => {
  try {
    const skymobileId = req.query.skymobileId ? parseInt(req.query.skymobileId as string) : null;
    const name = req.query.name as string;

    let query = 'SELECT * FROM customers WHERE 1=2';
    const params = [];
    let pIdx = 1;

    if (skymobileId && !isNaN(skymobileId)) {
      query += ` OR skymobile_customer_id = $${pIdx}`;
      params.push(skymobileId);
      pIdx++;
    }

    if (name) {
      query += ` OR customer_name = $${pIdx}`;
      params.push(name);
      pIdx++;
    }

    const { rows } = await pool.query(query + ' LIMIT 1', params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error looking up customer:', error);
    res.status(500).json({ error: 'Failed to look up customer' });
  }
});

// GET /api/customers/:id - Fetch a single customer's details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching customer by id:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /api/customers/orders - Create a new manual order for a customer
router.post('/orders', async (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      customer_avatar,
      branch_name,
      created_by,
      created_by_name,
      order_status,
      approval_status,
      payment_status,
      fulfillment_status,
      total_amount,
      product_quantity,
      commission_total,
      skymobile_order_id,
      product_name,
      selling_price,
      billing_rate,
      commission
    } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    // Auto-generate skymobile_order_id if not provided
    let finalOrderId = skymobile_order_id ? parseInt(skymobile_order_id.toString()) : null;
    if (!finalOrderId || isNaN(finalOrderId)) {
      const maxIdRes = await pool.query('SELECT MAX(skymobile_order_id) FROM orders');
      const maxId = maxIdRes.rows[0].max || 4000;
      finalOrderId = maxId + 1;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows } = await client.query(`
        INSERT INTO orders (
          skymobile_order_id, customer_id, customer_name, customer_avatar,
          branch_name, created_by, created_by_name, order_status, approval_status,
          payment_status, fulfillment_status, total_amount, product_quantity,
          commission_total, created_at, synced_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        finalOrderId,
        customer_id ? String(customer_id) : null,
        customer_name,
        customer_avatar || null,
        branch_name || 'Sky Mobile',
        created_by || 'system',
        created_by_name || 'Nhân viên',
        order_status || 'Pending',
        approval_status || 'Pending',
        payment_status || 'Unpaid',
        fulfillment_status || 'Unfulfilled',
        total_amount ? parseFloat(total_amount.toString()) : 0,
        product_quantity ? parseInt(product_quantity.toString()) : 1,
        commission_total ? parseFloat(commission_total.toString()) : 0
      ]);

      const createdOrder = rows[0];

      // If product_name is provided, also insert into order_items
      if (product_name) {
        const maxItemRes = await client.query('SELECT MAX(skymobile_item_id) FROM order_items');
        const maxItemId = maxItemRes.rows[0].max || 10000;
        const finalItemId = maxItemId + 1;

        await client.query(`
          INSERT INTO order_items (
            skymobile_item_id, order_id, product_name, quantity, selling_price, billing_rate, commission, synced_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [
          finalItemId,
          finalOrderId,
          product_name,
          product_quantity ? parseInt(product_quantity.toString()) : 1,
          selling_price ? parseFloat(selling_price.toString()) : (total_amount ? parseFloat(total_amount.toString()) : 0),
          billing_rate ? parseFloat(billing_rate.toString()) : 0,
          commission ? parseFloat(commission.toString()) : (commission_total ? parseFloat(commission_total.toString()) : 0)
        ]);
      }

      await client.query('COMMIT');
      res.json(createdOrder);
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error creating manual order:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
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

    // Attach related product items for the customer's orders
    if (rows.length > 0) {
      const orderIds = rows.map(r => r.skymobile_order_id);
      const itemsRes = await pool.query(
        'SELECT * FROM order_items WHERE order_id = ANY($1)',
        [orderIds]
      );
      
      const itemsByOrderId: Record<number, any[]> = {};
      for (const item of itemsRes.rows) {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        itemsByOrderId[item.order_id].push(item);
      }
      
      for (const order of rows) {
        order.items = itemsByOrderId[order.skymobile_order_id] || [];
      }
    }

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

// PATCH /api/customers/orders/:orderId/approval - Approve or reject an order
router.patch('/orders/:orderId/approval', async (req, res) => {
  try {
    const parsedId = parseInt(req.params.orderId);
    const { approval_status, approved_by, approved_by_name } = req.body;
    const allowedStatuses = ['Approved', 'Rejected', 'Cancelled', 'Pending'];

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Mã đơn hàng không hợp lệ' });
    }

    if (!allowedStatuses.includes(approval_status)) {
      return res.status(400).json({ error: 'Trạng thái phê duyệt không hợp lệ' });
    }

    const orderStatus = approval_status === 'Rejected' ? 'Cancelled' : approval_status;
    const approvedAtExpr = approval_status === 'Pending' ? 'NULL' : 'CURRENT_TIMESTAMP';

    const { rows } = await pool.query(`
      UPDATE orders
      SET approval_status = $1,
          order_status = $2,
          approved_by = $3,
          approved_by_name = $4,
          approved_at = ${approvedAtExpr},
          synced_at = CURRENT_TIMESTAMP
      WHERE id = $5 OR skymobile_order_id = $5
      RETURNING *
    `, [
      approval_status,
      orderStatus,
      approved_by || null,
      approved_by_name || null,
      parsedId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error updating order approval:', error);
    res.status(500).json({ error: 'Failed to update order approval', details: error.message });
  }
});

// PATCH /api/customers/orders/:orderId/payment - Update payment status for debt tracking
router.patch('/orders/:orderId/payment', async (req, res) => {
  try {
    const parsedId = parseInt(req.params.orderId);
    const { payment_status } = req.body;
    const allowedStatuses = ['Paid', 'Unpaid', 'Partial', 'Partially Paid', 'Refunded'];

    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Mã đơn hàng không hợp lệ' });
    }

    if (!allowedStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Trạng thái thanh toán không hợp lệ' });
    }

    const { rows } = await pool.query(`
      UPDATE orders
      SET payment_status = $1,
          synced_at = CURRENT_TIMESTAMP
      WHERE id = $2 OR skymobile_order_id = $2
      RETURNING *
    `, [payment_status, parsedId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status', details: error.message });
  }
});

// DELETE /api/customers/orders/:orderId - Delete a single manual or synced order
router.delete('/orders/:orderId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;
    
    // Parse orderId to integer
    const parsedId = parseInt(orderId);
    if (isNaN(parsedId)) {
      client.release();
      return res.status(400).json({ error: 'Mã đơn hàng không hợp lệ' });
    }
    
    await client.query('BEGIN');
    
    // Fetch the order to get both its auto-increment id and skymobile_order_id
    const orderRes = await client.query(
      'SELECT id, skymobile_order_id FROM orders WHERE id = $1 OR skymobile_order_id = $1',
      [parsedId]
    );
    
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }
    
    const order = orderRes.rows[0];
    
    // Explicitly delete from order_items first to avoid any foreign key constraint issues
    if (order.skymobile_order_id) {
      await client.query('DELETE FROM order_items WHERE order_id = $1', [order.skymobile_order_id]);
    }
    
    // Delete from orders
    await client.query('DELETE FROM orders WHERE id = $1', [order.id]);
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Đã xoá đơn hàng thành công.' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  } finally {
    client.release();
  }
});

// DELETE /api/customers/:id - Delete a customer and their linked orders
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    // Get customer info first
    const custRes = await client.query('SELECT id, skymobile_customer_id, customer_name FROM customers WHERE id = $1', [id]);
    if (custRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }
    
    const customer = custRes.rows[0];
    
    await client.query('BEGIN');
    
    // Explicitly select all matching orders to delete their order_items manually first (prevent FK violation on older DB schemas)
    let ordersQuery = 'SELECT id, skymobile_order_id FROM orders WHERE customer_id = $1';
    const ordersParams = [String(customer.id)];
    let pIdx = 2;
    
    if (customer.skymobile_customer_id) {
      ordersQuery += ` OR customer_id = $${pIdx}`;
      ordersParams.push(String(customer.skymobile_customer_id));
      pIdx++;
    }
    
    if (customer.customer_name) {
      ordersQuery += ` OR customer_name = $${pIdx}`;
      ordersParams.push(customer.customer_name);
      pIdx++;
    }
    
    const ordersRes = await client.query(ordersQuery, ordersParams);
    const orderIds = ordersRes.rows.map(r => r.skymobile_order_id).filter(oid => oid !== null);
    
    if (orderIds.length > 0) {
      // Manual cascade delete from order_items
      await client.query('DELETE FROM order_items WHERE order_id = ANY($1)', [orderIds]);
    }
    
    // Delete associated orders
    let deleteOrdersQuery = 'DELETE FROM orders WHERE customer_id = $1';
    const deleteOrdersParams = [String(customer.id)];
    let dpIdx = 2;
    
    if (customer.skymobile_customer_id) {
      deleteOrdersQuery += ` OR customer_id = $${dpIdx}`;
      deleteOrdersParams.push(String(customer.skymobile_customer_id));
      dpIdx++;
    }
    
    if (customer.customer_name) {
      deleteOrdersQuery += ` OR customer_name = $${dpIdx}`;
      deleteOrdersParams.push(customer.customer_name);
      dpIdx++;
    }
    
    await client.query(deleteOrdersQuery, deleteOrdersParams);
    
    // Delete the customer
    await client.query('DELETE FROM customers WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Đã xoá khách hàng và các đơn hàng liên quan thành công.' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer', details: error.message });
  } finally {
    client.release();
  }
});

export default router;
