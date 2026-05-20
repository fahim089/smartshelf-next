import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchSale } from '@/lib/transactions'
import { ok, msg, notFound, serverErr } from '@/lib/response'

export const GET = withAdmin(async (req, { params }) => {
  try {
    const sale = await fetchSale(params.id)
    if (!sale) return notFound('Sale not found.')
    return ok(sale)
  } catch (e) { return serverErr(e) }
})

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      const [items] = await conn.execute('SELECT product_id,quantity FROM sale_items WHERE sale_id=?', [params.id])
      for (const item of items) await conn.execute('UPDATE products SET stock_quantity=stock_quantity+? WHERE id=?', [item.quantity, item.product_id])
      const [r] = await conn.execute('DELETE FROM sales WHERE id=?', [params.id])
      if (!r.affectedRows) { await conn.rollback(); return notFound('Sale not found.') }
      await conn.commit()
      return msg('Sale deleted and stock restored.')
    } catch (e) { await conn.rollback(); throw e }
    finally { conn.release() }
  } catch (e) { return serverErr(e) }
})
