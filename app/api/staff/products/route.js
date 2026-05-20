import { withAuth } from '@/lib/auth'
import { listProducts } from '@/lib/products'
import { serverErr } from '@/lib/response'

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const result = await listProducts({ search: searchParams.get('search'), category_id: searchParams.get('category_id'), low_stock: searchParams.get('low_stock'), page: searchParams.get('page')||1, limit: searchParams.get('limit')||12 })
    return Response.json({ success: true, ...result })
  } catch (e) { return serverErr(e) }
})
