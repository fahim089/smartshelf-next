import { withAuth } from '@/lib/auth'
import { getProduct } from '@/lib/products'
import { ok, notFound, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, { params }) => {
  try {
    const p = await getProduct(parseInt(params.id))
    if (!p) return notFound('Product not found.')
    return ok(p)
  } catch (e) { return serverErr(e) }
})
