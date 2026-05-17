import { chromium } from 'playwright';
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function scrapeProducts() {
  console.log('🚀 Starting direct API products fetcher and database importer...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    let authHeader = '';

    // Listen to network requests to capture the Bearer token automatically
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/products') && request.headers()['authorization']) {
        authHeader = request.headers()['authorization'];
      }
    });

    console.log('🔑 Navigating to skymobile.vn/login...');
    await page.goto('https://skymobile.vn/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'tuanci5@gmail.com');
    await page.fill('input[type="password"]', 'thoigian1');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/app/**', { timeout: 15000 });
    console.log('✅ Logged in successfully!');

    console.log('📋 Navigating to product page to trigger API call...');
    await page.goto('https://skymobile.vn/app/products', { waitUntil: 'networkidle' });
    await page.waitForSelector('table, tbody tr', { timeout: 10000 });
    
    // Wait up to 3 seconds to ensure authHeader is populated
    for (let i = 0; i < 6; i++) {
      if (authHeader) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (!authHeader) {
      throw new Error('❌ Could not capture Authorization Header.');
    }

    console.log('🔑 Authorization Token captured. Closing browser...');
    await browser.close();

    console.log('📡 Fetching all products directly from API in Node...');
    const checkDate = new Date().toISOString();
    // Request all 100 products (since total items is 76)
    const apiUrl = `https://skymobile.vn/api/products?pageNumber=1&pageSize=100&checkDate=${checkDate}&branchId=1`;
    
    const res = await fetch(apiUrl, {
      headers: {
        'authorization': authHeader,
        'accept': 'application/json, text/plain, */*'
      }
    });
    
    if (!res.ok) {
      throw new Error(`API returned HTTP ${res.status}: ${res.statusText}`);
    }

    const response = await res.json() as any;
    const items = response.items || [];
    console.log(`🎉 API call successful! Found ${items.length} products total.`);

    if (items.length === 0) {
      console.log('❌ No products found from API.');
      await pool.end();
      return;
    }

    // 3. Connect to database and insert/update products
    console.log('📡 Connecting to local/configured database...');
    const client = await pool.connect();
    console.log('✅ Connected to database.');

    let insertedCount = 0;
    let updatedCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    for (const item of items) {
      const name = item.productName;
      if (!name) continue;

      // Determine sale type
      const isMonthly = item.salesTypeName?.toLowerCase().includes('monthly') || name.toLowerCase().includes('monthly');
      const saleType = isMonthly ? 'monthly' : 'outright';

      // Parse pricing & discounts
      const pricing = item.pricingInfo || {};
      const rawBillingRate = pricing.billingRate || 0;
      const rawSellingPrice = pricing.sellingPrice || 0;
      const billingRateDiscount = Math.abs(pricing.billingRateDiscount || 0);
      const sellingPriceDiscount = Math.abs(pricing.sellingPriceDiscount || 0);

      const netBillingRate = Math.max(0, rawBillingRate - billingRateDiscount);
      const netSellingPrice = Math.max(0, rawSellingPrice - sellingPriceDiscount);

      // Determine schema values
      const importPrice = netBillingRate;
      const importDate = pricing.nextBillingDate ? pricing.nextBillingDate.split('T')[0] : todayStr;
      
      const simDetails = item.simDetails || {};
      const deviceDetails = item.deviceDetails || {};
      const seller = simDetails.networkProvider || 'Sky Mobile';

      let category = 'SIM';
      if (item.deviceComponentId) {
        category = 'Thiết bị';
      } else if (simDetails.simGroup?.toLowerCase().includes('data') && !simDetails.simType) {
        category = 'Data';
      }

      // Generate description
      const descParts = [];
      if (simDetails.networkProvider) descParts.push(`Nhà mạng: ${simDetails.networkProvider}`);
      if (simDetails.simType) descParts.push(`Loại SIM: ${simDetails.simType}`);
      if (simDetails.simGroup) descParts.push(`Nhóm SIM: ${simDetails.simGroup}`);
      if (deviceDetails.deviceName) descParts.push(`Thiết bị: ${deviceDetails.deviceName}`);
      if (deviceDetails.deviceCondition) descParts.push(`Tình trạng: ${deviceDetails.deviceCondition}`);
      if (item.availableAtBranch !== null) descParts.push(`Tồn kho: ${item.availableAtBranch}`);
      
      const description = descParts.join(' | ');

      let salePrice = netSellingPrice;
      let initialPayment = 0;
      let monthlyPayments: any[] = [];

      if (isMonthly) {
        initialPayment = netSellingPrice; // Setup fee
        
        // Calculate duration in months
        let durationMonths = 12; // default
        if (item.durationValue) {
          const val = Number(item.durationValue);
          const unit = item.durationUnit?.toLowerCase() || '';
          if (unit.includes('year')) {
            durationMonths = val * 12;
          } else if (unit.includes('month')) {
            durationMonths = val;
          }
        }
        
        monthlyPayments = Array.from({ length: durationMonths }, (_, i) => ({
          month: i + 1,
          amount: netBillingRate
        }));
        
        salePrice = initialPayment + (netBillingRate * durationMonths);
      } else {
        salePrice = netSellingPrice;
        initialPayment = 0;
        monthlyPayments = [];
      }

      // Check if product exists by name
      const existing = await client.query('SELECT id FROM products WHERE name = $1', [name]);

      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        await client.query(
          `UPDATE products SET
            sale_price = $1,
            import_price = $2,
            import_date = $3,
            seller = $4,
            category = $5,
            description = $6,
            sale_type = $7,
            initial_payment = $8,
            monthly_payments = $9::jsonb
          WHERE id = $10`,
          [
            salePrice,
            importPrice,
            importDate,
            seller,
            category,
            description,
            saleType,
            initialPayment,
            JSON.stringify(monthlyPayments),
            id
          ]
        );
        updatedCount++;
      } else {
        await client.query(
          `INSERT INTO products (
            name, sale_price, import_price, import_date, seller, category,
            description, sale_type, initial_payment, monthly_payments
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
          [
            name,
            salePrice,
            importPrice,
            importDate,
            seller,
            category,
            description,
            saleType,
            initialPayment,
            JSON.stringify(monthlyPayments)
          ]
        );
        insertedCount++;
      }
    }

    client.release();
    console.log(`🎉 Finished successfully!`);
    console.log(`✅ Products inserted: ${insertedCount}`);
    console.log(`🔄 Products updated: ${updatedCount}`);
    console.log(`📊 Total processed: ${insertedCount + updatedCount}`);

  } catch (error) {
    console.error('❌ Error during scraping:', error);
  } finally {
    await pool.end();
  }
}

scrapeProducts();
