import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchReturn } from '@/lib/transactions'
import { ok, err, notFound, serverErr } from '@/lib/response'

export const PATCH = withAdmin(async (req, { params }) => {
  try {
    const { status } = await req.json()
    if (!['approved','rejected'].includes(status)) return err('Status must be approved or rejected.')
    const [ex] = await db.execute('SELECT id,status FROM returns WHERE id=?', [params.id])
    if (!ex.length) return notFound('Return not found.')
    if (ex[0].status !== 'pending') return err(`Return already ${ex[0].status}.`)
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      await conn.execute('UPDATE returns SET status=? WHERE id=?', [status, params.id])
      if (status === 'approved') {
        const [items] = await conn.execute('SELECT product_id,quantity FROM return_items WHERE return_id=?', [params.id])
        for (const item of items) await conn.execute('UPDATE products SET stock_quantity=stock_quantity+? WHERE id=?', [item.quantity, item.product_id])
      }
      await conn.commit()
    } catch (e) { await conn.rollback(); throw e }
    finally { conn.release() }
    const ret = await fetchReturn(params.id)
    return ok(ret)
  } catch (e) { return serverErr(e) }
})
