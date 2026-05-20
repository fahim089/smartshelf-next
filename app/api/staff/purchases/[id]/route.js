import { withAuth } from '@/lib/auth'
import { fetchPurchase } from '@/lib/transactions'
import { ok, notFound, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, { params }, user) => {
  try {
    const p = await fetchPurchase(params.id)
    if (!p) return notFound('Purchase not found.')
    if (user.role === 'staff' && p.staff_id !== user.id) return Response.json({ success: false, message: 'Access denied.' }, { status: 403 })
    return ok(p)
  } catch (e) { return serverErr(e) }
})
