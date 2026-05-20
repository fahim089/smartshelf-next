import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { getProduct, fetchImages } from '@/lib/products'
import { ok, msg, err, notFound, serverErr } from '@/lib/response'

export const GET = withAdmin(async (req, { params }) => {
  try {
    const product = await getProduct(params.id)
    if (!product) return notFound('Product not found.')
    return ok(product)
  } catch (e) { return serverErr(e) }
})

export const PUT = withAdmin(async (req, { params }) => {
  try {
    const body = await req.json()
    const { name,description,sku,price,cost_price,unit,stock_quantity,low_stock_threshold,category_id,is_active } = body
    const [ex] = await db.execute('SELECT id FROM products WHERE id=?', [params.id])
    if (!ex.length) return notFound('Product not found.')
    await db.execute(
      `UPDATE products SET
        category_id=COALESCE(?,category_id), name=COALESCE(?,name), description=?,
        sku=COALESCE(?,sku), price=COALESCE(?,price), cost_price=COALESCE(?,cost_price),
        unit=COALESCE(?,unit), stock_quantity=COALESCE(?,stock_quantity),
        low_stock_threshold=COALESCE(?,low_stock_threshold), is_active=COALESCE(?,is_active)
       WHERE id=?`,
      [category_id!==undefined?category_id:null, name||null, description!==undefined?description:undefined,
       sku||null, price||null, cost_price!==undefined?cost_price:null, unit||null,
       stock_quantity!==undefined?stock_quantity:null, low_stock_threshold!==undefined?low_stock_threshold:null,
       is_active!==undefined?(is_active?1:0):null, params.id]
    )
    const [rows] = await db.execute('SELECT * FROM products WHERE id=?', [params.id])
    rows[0].images = await fetchImages(params.id)
    return ok(rows[0])
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return err('SKU already exists.', 409)
    return serverErr(e)
  }
})

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const [r] = await db.execute('DELETE FROM products WHERE id=?', [params.id])
    if (!r.affectedRows) return notFound('Product not found.')
    return msg('Product deleted.')
  } catch (e) { return serverErr(e) }
})
