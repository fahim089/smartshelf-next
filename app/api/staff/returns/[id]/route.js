import { withAuth } from '@/lib/auth'
import { fetchReturn } from '@/lib/transactions'
import { ok, notFound, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, { params }, user) => {
  try {
    const r = await fetchReturn(params.id)
    if (!r) return notFound('Return not found.')
    if (user.role === 'staff' && r.staff_id !== user.id) return Response.json({ success: false, message: 'Access denied.' }, { status: 403 })
    return ok(r)
  } catch (e) { return serverErr(e) }
})
