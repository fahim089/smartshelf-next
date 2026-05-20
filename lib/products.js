import { getPool } from './db'

export function buildImageUrl(filename) {
  if (!filename) return null
  if (filename.startsWith('http')) return filename
  const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const file  = filename.replace(/.*\/uploads\//, '')
  return `${base}/uploads/${file}`
}

export async function fetchImages(productId) {
  const pool = getPool()
  const [imgs] = await pool.query(
    'SELECT id, image_url, sort_order FROM product_images WHERE product_id=? ORDER BY sort_order',
    [parseInt(productId)]
  )
  return imgs.map(img => ({ ...img, image_url: buildImageUrl(img.image_url) }))
}

export async function listProducts(params = {}) {
  const pool   = getPool()
  const search      = params.search      || null
  const category_id = params.category_id || null
  const low_stock   = params.low_stock   || null
  const page        = parseInt(params.page)  || 1
  const limit       = parseInt(params.limit) || 20
  const offset      = (page - 1) * limit

  const conds = ['p.is_active=1']
  const args  = []

  if (search) {
    conds.push('(p.name LIKE ? OR p.sku LIKE ?)')
    args.push(`%${search}%`, `%${search}%`)
  }
  if (category_id) {
    conds.push('p.category_id=?')
    args.push(parseInt(category_id))
  }
  if (low_stock === 'true') {
    conds.push('p.stock_quantity <= p.low_stock_threshold')
  }

  const where = conds.join(' AND ')

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p WHERE ${where}`, args
  )

  // Inline LIMIT and OFFSET as integers directly in SQL to avoid prepared statement type issues
  const [rows] = await pool.query(
    `SELECT p.id,p.name,p.sku,p.price,p.cost_price,p.unit,p.stock_quantity,p.low_stock_threshold,
            p.description,p.is_active,p.created_at,p.updated_at,
            c.id AS category_id,c.name AS category_name,
            CASE WHEN p.stock_quantity=0 THEN 'out_of_stock'
                 WHEN p.stock_quantity<=p.low_stock_threshold THEN 'low_stock'
                 ELSE 'in_stock' END AS stock_status
     FROM products p LEFT JOIN categories c ON p.category_id=c.id
     WHERE ${where} ORDER BY p.name LIMIT ${limit} OFFSET ${offset}`,
    args
  )

  for (const r of rows) r.images = await fetchImages(r.id)

  return {
    data: rows,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  }
}

export async function getProduct(id) {
  const pool = getPool()
  const [rows] = await pool.query(
    `SELECT p.*,c.id AS category_id,c.name AS category_name,
            CASE WHEN p.stock_quantity=0 THEN 'out_of_stock'
                 WHEN p.stock_quantity<=p.low_stock_threshold THEN 'low_stock'
                 ELSE 'in_stock' END AS stock_status
     FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.id=?`,
    [parseInt(id)]
  )
  if (!rows.length) return null
  rows[0].images = await fetchImages(parseInt(id))
  return rows[0]
}