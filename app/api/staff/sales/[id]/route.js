import { withAuth } from '@/lib/auth'
import { fetchSale } from '@/lib/transactions'
import { ok, notFound, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, { params }, user) => {
  try {
    const sale = await fetchSale(params.id)
    if (!sale) return notFound('Sale not found.')
    if (user.role === 'staff' && sale.staff_id !== user.id) return Response.json({ success: false, message: 'Access denied.' }, { status: 403 })
    return ok(sale)
  } catch (e) { return serverErr(e) }
})
