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
