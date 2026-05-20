import { withAuth } from '@/lib/auth'
import { fetchReturn } from '@/lib/transactions'
import { ok, notFound, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, { params }) => {
  try {
    const r = await fetchReturn(parseInt(params.id))
    if (!r) return notFound('Return not found.')
    return ok(r)
  } catch (e) { return serverErr(e) }
})
