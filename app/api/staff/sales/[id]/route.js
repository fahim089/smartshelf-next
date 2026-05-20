import { withAuth } from '@/lib/auth'
import { fetchSale } from '@/lib/transactions'
import { ok, notFound, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, { params }) => {
  try {
    const sale = await fetchSale(parseInt(params.id))
    if (!sale) return notFound('Sale not found.')
    return ok(sale)
  } catch (e) { return serverErr(e) }
})
