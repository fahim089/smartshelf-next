import { withAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { listReturns, fetchReturn } from '@/lib/transactions'
import { serverErr, err } from '@/lib/response'

export const GET = withAuth(async (req, ctx, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const result = await listReturns({ isAdmin: false, staffId: user.id, page: searchParams.get('page')||1, limit: searchParams.get('limit')||15 })
    return Response.json({ success: true, ...result })
  } catch (e) { return serverErr(e) }
})

export const POST = withAuth(async (req, ctx, user) => {
  try {
    const { sale_id, reason, items } = await req.json()
    if (!items?.length) return err('Return must have at least one item.')
    const total = items.reduce((s, it) => s + it.unit_price * it.quantity, 0)
    const [r] = await db.execute(
      'INSERT INTO returns (staff_id,sale_id,total_amount,reason,status) VALUES (?,?,?,?,?)',
      [user.id, sale_id||null, total, reason||null, 'pending']
    )
    for (const item of items) {
      await db.execute(
        'INSERT INTO return_items (return_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?)',
        [r.insertId, item.product_id, item.quantity, item.unit_price, item.unit_price*item.quantity]
      )
    }
    const ret = await fetchReturn(r.insertId)
    return Response.json({ success: true, data: ret }, { status: 201 })
  } catch (e) { return serverErr(e) }
})
