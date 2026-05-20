import { db } from './db'

export function buildImageUrl(filename) {
  if (!filename) return null
  if (filename.startsWith('http')) return filename
  const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const file  = filename.replace(/.*\/uploads\//, '')
  return `${base}/uploads/${file}`
}

export async function fetchImages(productId) {
  const [imgs] = await db.execute(
    'SELECT id, image_url, sort_order FROM product_images WHERE product_id=? ORDER BY sort_order',
    [parseInt(productId)]
  )
  return imgs.map(img => ({ ...img, image_url: buildImageUrl(img.image_url) }))
}

export async function listProducts(params = {}) {
  const { search, category_id, low_stock } = params
  const page   = parseInt(params.page)  || 1
  const limit  = parseInt(params.limit) || 20
  const offset = (page - 1) * limit

  const conds = ['p.is_active=1']
  const args  = []

  if (search) {
    conds.push('(p.name LIKE ? OR p.sku LIKE ?)')
    const t = `%${search}%`
    args.push(t, t)
  }
  if (category_id) {
    conds.push('p.category_id=?')
    args.push(parseInt(category_id))
  }
  if (low_stock === 'true') {
    conds.push('p.stock_quantity <= p.low_stock_threshold')
  }

  const where = conds.join(' AND ')
  const [[{ total }]] = await db.execute(
    `SELECT COUNT(*) AS total FROM products p WHERE ${where}`, args
  )
  const [rows] = await db.execute(
    `SELECT p.id,p.name,p.sku,p.price,p.cost_price,p.unit,p.stock_quantity,p.low_stock_threshold,
            p.description,p.is_active,p.created_at,p.updated_at,
            c.id AS category_id,c.name AS category_name,
            CASE WHEN p.stock_quantity=0 THEN 'out_of_stock'
                 WHEN p.stock_quantity<=p.low_stock_threshold THEN 'low_stock'
                 ELSE 'in_stock' END AS stock_status
     FROM products p LEFT JOIN categories c ON p.category_id=c.id
     WHERE ${where} ORDER BY p.name LIMIT ? OFFSET ?`,
    [...args, limit, offset]
  )
  for (const r of rows) r.images = await fetchImages(r.id)
  return {
    data: rows,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  }
}

export async function getProduct(id) {
  const [rows] = await db.execute(
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
