import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchPurchase } from '@/lib/transactions'
import { ok, msg, notFound, serverErr } from '@/lib/response'

export const GET = withAdmin(async (req, { params }) => {
  try {
    const p = await fetchPurchase(parseInt(params.id))
    if (!p) return notFound('Purchase not found.')
    return ok(p)
  } catch (e) { return serverErr(e) }
})

export const DELETE = withAdmin(async (req, { params }) => {
  const conn = await (await import('@/lib/db')).db.getConnection()
  try {
    const id = parseInt(params.id)
    await conn.beginTransaction()
    const [items] = await conn.execute('SELECT product_id, quantity FROM purchase_items WHERE purchase_id=?', [id])
    for (const item of items) {
      await conn.execute('UPDATE products SET stock_quantity=stock_quantity-? WHERE id=?', [parseInt(item.quantity), parseInt(item.product_id)])
    }
    const [r] = await conn.execute('DELETE FROM purchases WHERE id=?', [id])
    if (!r.affectedRows) { await conn.rollback(); return notFound('Purchase not found.') }
    await conn.commit()
    return msg('Purchase deleted.')
  } catch (e) { await conn.rollback(); return serverErr(e) }
  finally { conn.release() }
})
