import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { listProducts, fetchImages } from '@/lib/products'
import { ok, created, err, serverErr } from '@/lib/response'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const result = await listProducts({
      search:      searchParams.get('search'),
      category_id: searchParams.get('category_id'),
      low_stock:   searchParams.get('low_stock'),
      page:        searchParams.get('page') || 1,
      limit:       searchParams.get('limit') || 15,
    })
    return Response.json({ success: true, ...result })
  } catch (e) { return serverErr(e) }
})

export const POST = withAdmin(async (req) => {
  try {
    const body = await req.json()
    const { name, description, sku, price, cost_price, unit, stock_quantity=0, low_stock_threshold=5, category_id } = body
    if (!name || price === undefined) return err('Name and price are required.')
    const [r] = await db.execute(
      'INSERT INTO products (category_id,name,description,sku,price,cost_price,unit,stock_quantity,low_stock_threshold) VALUES (?,?,?,?,?,?,?,?,?)',
      [category_id||null, name, description||null, sku||null, price, cost_price||null, unit||null, stock_quantity, low_stock_threshold]
    )
    const [rows] = await db.execute('SELECT * FROM products WHERE id=?', [r.insertId])
    rows[0].images = await fetchImages(r.insertId)
    return created(rows[0])
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return err('A product with this SKU already exists.', 409)
    return serverErr(e)
  }
})
