import { chromium } from 'playwright';
import { pool } from '../db';

const SKY_MOBILE_BASE_URL = 'https://skymobile.vn';

const normalizeEnvCredential = (value?: string) => {
  const trimmed = (value || '').trim();
  return trimmed.replace(/^(["'])(.*)\1$/, '$2').trim();
};

const getSkyMobileCredentials = () => {
  const email = normalizeEnvCredential(process.env.SKYMOBILE_EMAIL || process.env.SKY_MOBILE_EMAIL);
  const password = normalizeEnvCredential(process.env.SKYMOBILE_PASSWORD || process.env.SKY_MOBILE_PASSWORD);

  if (!email || !password) {
    throw new Error('Thiếu cấu hình đăng nhập Sky Mobile. Vui lòng thiết lập SKYMOBILE_EMAIL/SKYMOBILE_PASSWORD hoặc SKY_MOBILE_EMAIL/SKY_MOBILE_PASSWORD trong biến môi trường.');
  }

  return { email, password };
};

const truncateBody = (body: string, maxLength = 500) => {
  if (!body) return '';
  return body.length > maxLength ? `${body.slice(0, maxLength)}...` : body;
};

const ensureOkResponse = async (res: Response, context: string) => {
  if (res.ok) return;

  let body = '';
  try {
    body = truncateBody(await res.text());
  } catch {
    body = '';
  }

  throw new Error(`${context} thất bại với HTTP ${res.status}${body ? ` - ${body}` : ''}`);
};

export interface SyncResult {
  success: boolean;
  mode?: 'incremental' | 'full';
  syncFrom?: string | null;
  ordersProcessed: number;
  ordersInserted: number;
  ordersUpdated: number;
  customersProcessed: number;
  customersInserted: number;
  customersUpdated: number;
  promotionsProcessed?: number;
  promotionsInserted?: number;
  promotionsUpdated?: number;
  error?: string;
}

interface SyncOptions {
  mode?: 'incremental' | 'full';
}

const toValidDate = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const getItemDate = (item: any) => toValidDate(item?.updatedAt || item?.createdAt || item?.CreatedAt || item?.dateCreated);

const isItemOnOrAfter = (item: any, since: Date | null) => {
  if (!since) return true;
  const itemDate = getItemDate(item);
  if (!itemDate) return true;
  return itemDate >= since;
};

const isPageDefinitelyOlderThan = (items: any[], since: Date | null) => {
  if (!since || items.length === 0) return false;
  return items.every(item => {
    const itemDate = getItemDate(item);
    return itemDate ? itemDate < since : false;
  });
};

const getIncrementalStartDate = async () => {
  const { rows } = await pool.query(`
    SELECT GREATEST(
      COALESCE((SELECT MAX(created_at) FROM orders WHERE skymobile_order_id IS NOT NULL), '1970-01-01'::timestamp),
      COALESCE((SELECT MAX(created_at) FROM customers WHERE skymobile_customer_id IS NOT NULL), '1970-01-01'::timestamp),
      COALESCE((SELECT MAX(created_at) FROM promotions WHERE skymobile_promo_id IS NOT NULL), '1970-01-01'::timestamp)
    ) AS latest_created_at
  `);

  const latest = rows[0]?.latest_created_at ? new Date(rows[0].latest_created_at) : null;
  if (!latest || latest.getFullYear() <= 1970) return null;

  // Đồng bộ lại từ đầu ngày gần nhất để không bỏ sót bản ghi cập nhật muộn trong ngày đó.
  latest.setHours(0, 0, 0, 0);
  return latest;
};

export async function syncFromSkyMobile(progressCallback?: (msg: string) => void, options: SyncOptions = {}): Promise<SyncResult> {
  const log = (msg: string) => {
    console.log(`[Sync] ${msg}`);
    if (progressCallback) progressCallback(msg);
  };

  const mode = options.mode || 'incremental';
  const incrementalSince = mode === 'incremental' ? await getIncrementalStartDate() : null;
  const incrementalSinceLabel = incrementalSince ? incrementalSince.toISOString().slice(0, 10) : null;

  log('🚀 Khởi tạo đồng bộ dữ liệu Sky Mobile...');
  if (mode === 'incremental') {
    log(incrementalSinceLabel
      ? `🔎 Chế độ bổ sung: chỉ xử lý dữ liệu từ ${incrementalSinceLabel} đến hiện tại.`
      : '🔎 Chế độ bổ sung: chưa có mốc dữ liệu cũ, sẽ đồng bộ toàn bộ lần đầu.');
  } else {
    log('🔁 Chế độ toàn bộ: tải lại tất cả dữ liệu từ Sky Mobile.');
  }
   
  let browser;
  try {
    const credentials = getSkyMobileCredentials();

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
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
    await page.goto(`${SKY_MOBILE_BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', credentials.email);
    await page.fill('input[type="password"]', credentials.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/app/**', { timeout: 15000 });
    log('✅ Đăng nhập thành công!');

    log('📋 Đang chuyển hướng tới trang đơn hàng để trích xuất Access Token...');
    await page.goto(`${SKY_MOBILE_BASE_URL}/app/orders`, { waitUntil: 'networkidle' });
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
      const url = `${SKY_MOBILE_BASE_URL}/api/orders?pageNumber=${orderPage}&pageSize=100&sortBy=CreatedAt&sortDirection=DESC&branchId=1`;
      
      const res = await fetch(url, {
        headers: {
          'authorization': authHeader,
          'accept': 'application/json, text/plain, */*'
        }
      });

      await ensureOkResponse(res, `Sky Mobile Orders API (trang ${orderPage})`);

      const data = await res.json() as any;
      const items = data.items || [];
      ordersList.push(...items.filter((item: any) => isItemOnOrAfter(item, incrementalSince)));

      if (items.length < 100 || isPageDefinitelyOlderThan(items, incrementalSince)) {
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
      const url = `${SKY_MOBILE_BASE_URL}/api/customers?pageNumber=${customerPage}&pageSize=100`;
      
      const res = await fetch(url, {
        headers: {
          'authorization': authHeader,
          'accept': 'application/json, text/plain, */*'
        }
      });

      await ensureOkResponse(res, `Sky Mobile Customers API (trang ${customerPage})`);

      const data = await res.json() as any;
      const items = data.items || [];
      customersList.push(...items.filter((item: any) => isItemOnOrAfter(item, incrementalSince)));

      if (items.length < 100 || isPageDefinitelyOlderThan(items, incrementalSince)) {
        hasMoreCustomers = false;
      } else {
        customerPage++;
      }
    }

    log(`🎉 Tìm thấy tổng cộng ${customersList.length} khách hàng. Đang cập nhật vào cơ sở dữ liệu...`);

    // Fetch and sync Promotions
    log('📡 Bắt đầu tải danh sách khuyến mại từ Sky Mobile API...');
    let promotionsProcessed = 0;
    let promotionsInserted = 0;
    let promotionsUpdated = 0;

    let promoPage = 1;
    let hasMorePromotions = true;
    const promotionsList: any[] = [];

    while (hasMorePromotions) {
      log(`📡 Đang tải trang khuyến mại ${promoPage}...`);
      const url = `${SKY_MOBILE_BASE_URL}/api/promotions?pageNumber=${promoPage}&pageSize=100`;

      const res = await fetch(url, {
        headers: {
          'authorization': authHeader,
          'accept': 'application/json, text/plain, */*'
        }
      });

      await ensureOkResponse(res, `Sky Mobile Promotions API (trang ${promoPage})`);

      const data = await res.json() as any;
      const items = data.items || [];
      promotionsList.push(...items.filter((item: any) => isItemOnOrAfter(item, incrementalSince)));

      if (items.length < 100 || isPageDefinitelyOlderThan(items, incrementalSince)) {
        hasMorePromotions = false;
      } else {
        promoPage++;
      }
    }

    log(`🎉 Tìm thấy tổng cộng ${promotionsList.length} khuyến mại. Đang cập nhật vào cơ sở dữ liệu...`);

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

        const checkRes = await client.query('SELECT id, order_status FROM orders WHERE skymobile_order_id = $1', [o.id]);
        let shouldFetchDetails = false;

        if (checkRes.rows.length > 0) {
          const existingOrder = checkRes.rows[0];
          // Check if we have items for this existing order
          const itemsCheck = await client.query('SELECT 1 FROM order_items WHERE order_id = $1 LIMIT 1', [o.id]);
          const hasItems = itemsCheck.rows.length > 0;

          // Only fetch details if status changed or items are missing
          if (existingOrder.order_status !== o.orderStatus || !hasItems) {
            shouldFetchDetails = true;
          }

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
          shouldFetchDetails = true;
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

        // Tải chi tiết đơn hàng khi cần thiết để tránh order_items bị cũ hoặc thiếu
        if (shouldFetchDetails) {
          try {
            const detailUrl = `${SKY_MOBILE_BASE_URL}/api/orders/${o.id}`;
            const detailRes = await fetch(detailUrl, {
              headers: {
                'authorization': authHeader,
                'accept': 'application/json, text/plain, */*'
              }
            });

            await ensureOkResponse(detailRes, `Sky Mobile Order Detail API (đơn ${o.id})`);

            const detailData = await detailRes.json() as any;
            const items = detailData.orderItems || [];

            // Clear old items for this order to avoid stale data and duplicates on update.
            await client.query('DELETE FROM order_items WHERE order_id = $1', [o.id]);

            for (const item of items) {
              if (!item.id) continue;
              await client.query(`
                INSERT INTO order_items (
                  skymobile_item_id, order_id, product_id, product_name,
                  quantity, selling_price, billing_rate, commission
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (skymobile_item_id) DO UPDATE SET
                  product_id = EXCLUDED.product_id,
                  product_name = EXCLUDED.product_name,
                  quantity = EXCLUDED.quantity,
                  selling_price = EXCLUDED.selling_price,
                  billing_rate = EXCLUDED.billing_rate,
                  commission = EXCLUDED.commission,
                  synced_at = CURRENT_TIMESTAMP
              `, [
                item.id,
                o.id,
                item.productId,
                item.productName,
                item.quantity,
                item.effectiveSellingPrice || item.sellingPricePromo || 0,
                item.effectiveBillingRate || item.billingRatePromo || 0,
                item.commission || 0
              ]);
            }
          } catch (itemErr: any) {
            console.error(`Error syncing items for order ${o.id}:`, itemErr.message);
            log(`⚠️ Không thể đồng bộ chi tiết đơn ${o.id}: ${itemErr.message}`);
          }
        }
      }

      // 3. Process Promotions
      log('💾 Đang lưu dữ liệu khuyến mại vào cơ sở dữ liệu...');
      for (const p of promotionsList) {
        if (!p.id) continue;
        promotionsProcessed++;

        const checkRes = await client.query('SELECT id FROM promotions WHERE skymobile_promo_id = $1', [p.id]);

        if (checkRes.rows.length > 0) {
          // Update
          await client.query(`
            UPDATE promotions SET
              promotion_type = $2,
              product_id = $3,
              product_name = $4,
              fixed_broadband_product_id = $5,
              fixed_broadband_product_name = $6,
              branch_shipping_method_id = $7,
              branch_shipping_method_name = $8,
              start_date = $9,
              end_date = $10,
              discount_amount = $11,
              discount_type = $12,
              branch_id = $13,
              branch_name = $14,
              is_active = $15,
              created_by = $16,
              created_at = $17,
              updated_at = $18,
              synced_at = CURRENT_TIMESTAMP
            WHERE skymobile_promo_id = $1
          `, [
            p.id,
            p.promotionType,
            p.productId,
            p.productName,
            p.fixedBroadbandProductId,
            p.fixedBroadbandProductName,
            p.branchShippingMethodId,
            p.branchShippingMethodName,
            p.startDate,
            p.endDate,
            p.discountAmount,
            p.discountType,
            p.branchId,
            p.branchName,
            p.isActive,
            p.createdBy,
            p.createdAt,
            p.updatedAt
          ]);
          promotionsUpdated++;
        } else {
          // Insert
          await client.query(`
            INSERT INTO promotions (
              skymobile_promo_id, promotion_type, product_id, product_name,
              fixed_broadband_product_id, fixed_broadband_product_name,
              branch_shipping_method_id, branch_shipping_method_name,
              start_date, end_date, discount_amount, discount_type,
              branch_id, branch_name, is_active, created_by,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          `, [
            p.id,
            p.promotionType,
            p.productId,
            p.productName,
            p.fixedBroadbandProductId,
            p.fixedBroadbandProductName,
            p.branchShippingMethodId,
            p.branchShippingMethodName,
            p.startDate,
            p.endDate,
            p.discountAmount,
            p.discountType,
            p.branchId,
            p.branchName,
            p.isActive,
            p.createdBy,
            p.createdAt,
            p.updatedAt
          ]);
          promotionsInserted++;
        }
      }

      await client.query('COMMIT');
      log(`🎉 Đồng bộ hoàn tất! Đã xử lý ${customersProcessed} khách hàng, ${ordersProcessed} đơn hàng & ${promotionsProcessed} khuyến mại${incrementalSinceLabel ? ` từ ${incrementalSinceLabel}` : ''}.`);
      log(`📊 Kết quả: đơn +${ordersInserted}/cập nhật ${ordersUpdated}, khách +${customersInserted}/cập nhật ${customersUpdated}, khuyến mại +${promotionsInserted}/cập nhật ${promotionsUpdated}.`);
      
      return {
        success: true,
        mode,
        syncFrom: incrementalSinceLabel,
        ordersProcessed,
        ordersInserted,
        ordersUpdated,
        customersProcessed,
        customersInserted,
        customersUpdated,
        promotionsProcessed,
        promotionsInserted,
        promotionsUpdated
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
      mode,
      syncFrom: incrementalSinceLabel,
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
