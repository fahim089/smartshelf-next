import { withAuth } from '@/lib/auth'
import { fetchPurchase } from '@/lib/transactions'
import { ok, notFound, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, { params }) => {
  try {
    const p = await fetchPurchase(parseInt(params.id))
    if (!p) return notFound('Purchase not found.')
    return ok(p)
  } catch (e) { return serverErr(e) }
})
