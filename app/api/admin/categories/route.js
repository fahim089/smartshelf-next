import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, created, err, serverErr } from '@/lib/response'

export const GET = withAdmin(async () => {
  try {
    const [rows] = await db.execute(
      `SELECT c.id,c.name,c.created_at,COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.is_active=1
       GROUP BY c.id ORDER BY c.name`
    )
    return ok(rows)
  } catch (e) { return serverErr(e) }
})

export const POST = withAdmin(async (req) => {
  try {
    const { name } = await req.json()
    if (!name?.trim()) return err('Category name is required.')
    const [r] = await db.execute('INSERT INTO categories (name) VALUES (?)', [name.trim()])
    return created({ id: r.insertId, name: name.trim(), product_count: 0 })
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return err('Category already exists.', 409)
    return serverErr(e)
  }
})
