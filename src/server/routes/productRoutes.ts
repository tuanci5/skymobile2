import express from 'express';
import { pool } from '../db';

const router = express.Router();

type MonthlyPayment = {
  month: number;
  amount: number;
};

const normalizeMonthlyPayments = (value: unknown): MonthlyPayment[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const payment = item as Partial<MonthlyPayment>;
      return {
        month: Number(payment.month || index + 1),
        amount: Number(payment.amount || 0)
      };
    })
    .filter(payment => payment.month > 0 && payment.amount >= 0);
};

const normalizeProductPayload = (body: any) => {
  const saleType = body.sale_type === 'monthly' ? 'monthly' : 'outright';
  const initialPayment = Number(body.initial_payment || 0);
  const monthlyPayments = normalizeMonthlyPayments(body.monthly_payments);
  const calculatedSalePrice = saleType === 'monthly'
    ? initialPayment + monthlyPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0)
    : Number(body.sale_price || 0);

  return {
    name: String(body.name || '').trim(),
    sale_price: calculatedSalePrice,
    import_price: Number(body.import_price || 0),
    import_date: body.import_date || null,
    seller: body.seller || '',
    category: body.category || '',
    description: body.description || '',
    sale_type: saleType,
    initial_payment: saleType === 'monthly' ? initialPayment : 0,
    monthly_payments: saleType === 'monthly' ? monthlyPayments : []
  };
};

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC, id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = normalizeProductPayload(req.body);
    if (!product.name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO products (
        name, sale_price, import_price, import_date, seller, category,
        description, sale_type, initial_payment, monthly_payments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      RETURNING *`,
      [
        product.name,
        product.sale_price,
        product.import_price,
        product.import_date,
        product.seller,
        product.category,
        product.description,
        product.sale_type,
        product.initial_payment,
        JSON.stringify(product.monthly_payments)
      ]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = normalizeProductPayload(req.body);
    if (!product.name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const { rows } = await pool.query(
      `UPDATE products SET
        name = $1,
        sale_price = $2,
        import_price = $3,
        import_date = $4,
        seller = $5,
        category = $6,
        description = $7,
        sale_type = $8,
        initial_payment = $9,
        monthly_payments = $10::jsonb
      WHERE id = $11
      RETURNING *`,
      [
        product.name,
        product.sale_price,
        product.import_price,
        product.import_date,
        product.seller,
        product.category,
        product.description,
        product.sale_type,
        product.initial_payment,
        JSON.stringify(product.monthly_payments),
        id
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
