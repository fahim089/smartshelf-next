import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchReturn } from '@/lib/transactions'
import { ok, msg, notFound, serverErr } from '@/lib/response'

export const GET = withAdmin(async (req, { params }) => {
  try {
    const r = await fetchReturn(parseInt(params.id))
    if (!r) return notFound('Return not found.')
    return ok(r)
  } catch (e) { return serverErr(e) }
})

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const id = parseInt(params.id)
    const [ex] = await db.execute('SELECT status FROM returns WHERE id=?', [id])
    if (!ex.length) return notFound('Return not found.')
    await db.execute('DELETE FROM returns WHERE id=?', [id])
    return msg('Return deleted.')
  } catch (e) { return serverErr(e) }
})
