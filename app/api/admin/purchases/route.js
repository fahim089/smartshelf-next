import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { listPurchases, fetchPurchase } from '@/lib/transactions'
import { serverErr, err } from '@/lib/response'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const result = await listPurchases({ isAdmin: true, staffFilter: searchParams.get('staff_id'), dateFrom: searchParams.get('date_from'), dateTo: searchParams.get('date_to'), page: searchParams.get('page')||1, limit: searchParams.get('limit')||20 })
    return Response.json({ success: true, ...result })
  } catch (e) { return serverErr(e) }
})

export const POST = withAdmin(async (req, ctx, user) => {
  try {
    const { supplier_id, note, items, staff_id: body_staff_id } = await req.json()
    if (!items?.length) return err('Purchase must have at least one item.')
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      let total = 0
      for (const item of items) {
        const [rows] = await conn.execute('SELECT id FROM products WHERE id=? AND is_active=1', [item.product_id])
        if (!rows.length) { await conn.rollback(); return err(`Product ${item.product_id} not found.`, 404) }
        total += item.unit_price * item.quantity
      }
      const effectiveStaffId = body_staff_id || user.id
      const [pr] = await conn.execute('INSERT INTO purchases (staff_id,supplier_id,total_amount,note) VALUES (?,?,?,?)', [effectiveStaffId, supplier_id||null, total, note||null])
      for (const item of items) {
        await conn.execute('INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?)', [pr.insertId, item.product_id, item.quantity, item.unit_price, item.unit_price*item.quantity])
        await conn.execute('UPDATE products SET stock_quantity=stock_quantity+? WHERE id=?', [item.quantity, item.product_id])
      }
      await conn.commit()
      const purchase = await fetchPurchase(pr.insertId)
      return Response.json({ success: true, data: purchase }, { status: 201 })
    } catch (e) { await conn.rollback(); throw e }
    finally { conn.release() }
  } catch (e) { return serverErr(e) }
})
