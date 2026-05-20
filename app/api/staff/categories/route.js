import { withAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, serverErr } from '@/lib/response'

export const GET = withAuth(async () => {
  try {
    const [rows] = await db.execute(`SELECT c.id,c.name,COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.is_active=1 GROUP BY c.id ORDER BY c.name`)
    return ok(rows)
  } catch (e) { return serverErr(e) }
})
