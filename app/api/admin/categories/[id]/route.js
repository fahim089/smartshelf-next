import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { msg, err, notFound, serverErr } from '@/lib/response'

export const PUT = withAdmin(async (req, { params }) => {
  try {
    const { name } = await req.json()
    if (!name?.trim()) return err('Category name is required.')
    const [r] = await db.execute('UPDATE categories SET name=? WHERE id=?', [name.trim(), params.id])
    if (!r.affectedRows) return notFound()
    return msg('Category updated.')
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return err('Category name already exists.', 409)
    return serverErr(e)
  }
})

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const [r] = await db.execute('DELETE FROM categories WHERE id=?', [params.id])
    if (!r.affectedRows) return notFound()
    return msg('Category deleted.')
  } catch (e) { return serverErr(e) }
})
