import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchReturn } from '@/lib/transactions'
import { ok, err, notFound, serverErr } from '@/lib/response'

export const PATCH = withAdmin(async (req, { params }) => {
  const conn = await db.getConnection()
  try {
    const id = parseInt(params.id)
    const { status } = await req.json()
    if (!['approved','rejected'].includes(status)) return err('Status must be approved or rejected.')
    const [ex] = await conn.execute('SELECT id, status FROM returns WHERE id=?', [id])
    if (!ex.length) return notFound('Return not found.')
    if (ex[0].status !== 'pending') return err('Only pending returns can be updated.')
    await conn.beginTransaction()
    await conn.execute('UPDATE returns SET status=? WHERE id=?', [status, id])
    if (status === 'approved') {
      const [items] = await conn.execute('SELECT product_id, quantity FROM return_items WHERE return_id=?', [id])
      for (const item of items) {
        await conn.execute('UPDATE products SET stock_quantity=stock_quantity+? WHERE id=?', [parseInt(item.quantity), parseInt(item.product_id)])
      }
    }
    await conn.commit()
    const ret = await fetchReturn(id)
    return ok(ret)
  } catch (e) { await conn.rollback(); return serverErr(e) }
  finally { conn.release() }
})
