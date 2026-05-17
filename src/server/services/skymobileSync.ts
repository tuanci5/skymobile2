import { chromium } from 'playwright';
import { pool } from '../db';

export interface SyncResult {
  success: boolean;
  ordersProcessed: number;
  ordersInserted: number;
  ordersUpdated: number;
  customersProcessed: number;
  customersInserted: number;
  customersUpdated: number;
  error?: string;
}

export async function syncFromSkyMobile(progressCallback?: (msg: string) => void): Promise<SyncResult> {
  const log = (msg: string) => {
    console.log(`[Sync] ${msg}`);
    if (progressCallback) progressCallback(msg);
  };

  log('🚀 Khởi tạo đồng bộ dữ liệu Sky Mobile...');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let authHeader = '';

    // Listen to network requests to capture the authorization token
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/orders') && request.headers()['authorization']) {
        authHeader = request.headers()['authorization'];
      }
    });

    log('🔑 Đang đăng nhập vào skymobile.vn...');
    await page.goto('https://skymobile.vn/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'tuanci5@gmail.com');
    await page.fill('input[type="password"]', 'thoigian1');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/app/**', { timeout: 15000 });
    log('✅ Đăng nhập thành công!');

    log('📋 Đang chuyển hướng tới trang đơn hàng để trích xuất Access Token...');
    await page.goto('https://skymobile.vn/app/orders', { waitUntil: 'networkidle' });
    await page.waitForSelector('table, tbody tr', { timeout: 10000 });

    for (let i = 0; i < 6; i++) {
      if (authHeader) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (!authHeader) {
      throw new Error('Không thể lấy mã Authorization Header từ phiên làm việc.');
    }

    log('🔑 Đã lấy được mã bảo mật. Đóng trình duyệt ảo...');
    await browser.close();
    browser = null;

    // Fetch and sync Orders
    log('📡 Bắt đầu tải danh sách đơn hàng từ Sky Mobile API...');
    let ordersProcessed = 0;
    let ordersInserted = 0;
    let ordersUpdated = 0;
    
    let orderPage = 1;
    let hasMoreOrders = true;
    const ordersList: any[] = [];

    while (hasMoreOrders) {
      log(`📡 Đang tải trang đơn hàng ${orderPage}...`);
      const url = `https://skymobile.vn/api/orders?pageNumber=${orderPage}&pageSize=100&sortBy=CreatedAt&sortDirection=DESC&branchId=1`;
      
      const res = await fetch(url, {
        headers: {
          'authorization': authHeader,
          'accept': 'application/json, text/plain, */*'
        }
      });

      if (!res.ok) {
        throw new Error(`Sky Mobile Orders API returned HTTP ${res.status}`);
      }

      const data = await res.json() as any;
      const items = data.items || [];
      ordersList.push(...items);

      if (items.length < 100) {
        hasMoreOrders = false;
      } else {
        orderPage++;
      }
    }

    log(`🎉 Tìm thấy tổng cộng ${ordersList.length} đơn hàng. Đang cập nhật vào cơ sở dữ liệu...`);

    // Fetch and sync Customers
    log('📡 Bắt đầu tải danh sách khách hàng từ Sky Mobile API...');
    let customersProcessed = 0;
    let customersInserted = 0;
    let customersUpdated = 0;
    
    let customerPage = 1;
    let hasMoreCustomers = true;
    const customersList: any[] = [];

    while (hasMoreCustomers) {
      log(`📡 Đang tải trang khách hàng ${customerPage}...`);
      const url = `https://skymobile.vn/api/customers?pageNumber=${customerPage}&pageSize=100`;
      
      const res = await fetch(url, {
        headers: {
          'authorization': authHeader,
          'accept': 'application/json, text/plain, */*'
        }
      });

      if (!res.ok) {
        throw new Error(`Sky Mobile Customers API returned HTTP ${res.status}`);
      }

      const data = await res.json() as any;
      const items = data.items || [];
      customersList.push(...items);

      if (items.length < 100) {
        hasMoreCustomers = false;
      } else {
        customerPage++;
      }
    }

    log(`🎉 Tìm thấy tổng cộng ${customersList.length} khách hàng. Đang cập nhật vào cơ sở dữ liệu...`);

    // Database Connection & Operations
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Process Customers
      for (const c of customersList) {
        if (!c.id) continue;
        customersProcessed++;

        const checkRes = await client.query('SELECT id FROM customers WHERE skymobile_customer_id = $1', [c.id]);
        
        if (checkRes.rows.length > 0) {
          // Update
          await client.query(`
            UPDATE customers SET
              customer_name = $2,
              phone_number = $3,
              email = $4,
              avatar = $5,
              sales_channel_id = $6,
              sales_channel_name = $7,
              sales_channel_type = $8,
              facebook_uid = $9,
              nationality_id = $10,
              nationality_name = $11,
              conversation_id = $12,
              branch_id = $13,
              branch_name = $14,
              created_by = $15,
              created_by_name = $16,
              created_at = $17,
              synced_at = CURRENT_TIMESTAMP
            WHERE skymobile_customer_id = $1
          `, [
            c.id,
            c.customerName,
            c.phoneNumber,
            c.email,
            c.avatar,
            c.salesChannelId,
            c.salesChannelName,
            c.salesChannelType,
            c.facebookUid,
            c.nationalityId,
            c.nationalityName,
            c.conversationId,
            c.branchId,
            c.branchName,
            c.createdBy,
            c.createdByName,
            c.createdAt
          ]);
          customersUpdated++;
        } else {
          // Insert
          await client.query(`
            INSERT INTO customers (
              skymobile_customer_id, customer_name, phone_number, email, avatar,
              sales_channel_id, sales_channel_name, sales_channel_type, facebook_uid,
              nationality_id, nationality_name, conversation_id, branch_id, branch_name,
              created_by, created_by_name, created_at, source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'skymobile')
          `, [
            c.id,
            c.customerName,
            c.phoneNumber,
            c.email,
            c.avatar,
            c.salesChannelId,
            c.salesChannelName,
            c.salesChannelType,
            c.facebookUid,
            c.nationalityId,
            c.nationalityName,
            c.conversationId,
            c.branchId,
            c.branchName,
            c.createdBy,
            c.createdByName,
            c.createdAt
          ]);
          customersInserted++;
        }
      }

      // 2. Process Orders
      for (const o of ordersList) {
        if (!o.id) continue;
        ordersProcessed++;

        const checkRes = await client.query('SELECT id FROM orders WHERE skymobile_order_id = $1', [o.id]);
        
        if (checkRes.rows.length > 0) {
          // Update
          await client.query(`
            UPDATE orders SET
              customer_id = $2,
              customer_name = $3,
              customer_avatar = $4,
              branch_name = $5,
              created_by = $6,
              created_by_name = $7,
              order_status = $8,
              approval_status = $9,
              payment_status = $10,
              fulfillment_status = $11,
              total_amount = $12,
              created_at = $13,
              payment_message_sent = $14,
              sales_type = $15,
              product_quantity = $16,
              commission_total = $17,
              synced_at = CURRENT_TIMESTAMP
            WHERE skymobile_order_id = $1
          `, [
            o.id,
            o.customerId?.toString(),
            o.customerName,
            o.customerAvatar,
            o.branchName,
            o.createdBy,
            o.createdByName,
            o.orderStatus,
            o.approvalStatus,
            o.paymentStatus,
            o.fulfillmentStatus,
            o.totalAmount,
            o.createdAt,
            o.paymentMessageSent,
            o.salesType,
            o.productQuantity,
            o.commissionTotal
          ]);
          ordersUpdated++;
        } else {
          // Insert
          await client.query(`
            INSERT INTO orders (
              skymobile_order_id, customer_id, customer_name, customer_avatar,
              branch_name, created_by, created_by_name, order_status, approval_status,
              payment_status, fulfillment_status, total_amount, created_at,
              payment_message_sent, sales_type, product_quantity, commission_total
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          `, [
            o.id,
            o.customerId?.toString(),
            o.customerName,
            o.customerAvatar,
            o.branchName,
            o.createdBy,
            o.createdByName,
            o.orderStatus,
            o.approvalStatus,
            o.paymentStatus,
            o.fulfillmentStatus,
            o.totalAmount,
            o.createdAt,
            o.paymentMessageSent,
            o.salesType,
            o.productQuantity,
            o.commissionTotal
          ]);
          ordersInserted++;
        }
      }

      await client.query('COMMIT');
      log(`🎉 Đồng bộ hoàn tất! Cập nhật thành công ${customersProcessed} khách hàng & ${ordersProcessed} đơn hàng.`);
      
      return {
        success: true,
        ordersProcessed,
        ordersInserted,
        ordersUpdated,
        customersProcessed,
        customersInserted,
        customersUpdated
      };
    } catch (dbErr: any) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

  } catch (error: any) {
    log(`❌ Lỗi đồng bộ: ${error.message}`);
    if (browser) {
      await (browser as any).close().catch(() => {});
    }
    return {
      success: false,
      ordersProcessed: 0,
      ordersInserted: 0,
      ordersUpdated: 0,
      customersProcessed: 0,
      customersInserted: 0,
      customersUpdated: 0,
      error: error.message
    };
  }
}
