import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchReturn } from '@/lib/transactions'
import { ok, msg, notFound, serverErr } from '@/lib/response'

export const GET = withAdmin(async (req, { params }) => {
  try {
    const r = await fetchReturn(params.id)
    if (!r) return notFound('Return not found.')
    return ok(r)
  } catch (e) { return serverErr(e) }
})

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const [ex] = await db.execute('SELECT status FROM returns WHERE id=?', [params.id])
    if (!ex.length) return notFound('Return not found.')
    if (ex[0].status !== 'pending') return Response.json({ success: false, message: 'Only pending returns can be deleted.' }, { status: 400 })
    await db.execute('DELETE FROM returns WHERE id=?', [params.id])
    return msg('Return deleted.')
  } catch (e) { return serverErr(e) }
})
