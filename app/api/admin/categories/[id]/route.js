import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, msg, err, notFound, serverErr } from '@/lib/response'

export const PUT = withAdmin(async (req, { params }) => {
  try {
    const id = parseInt(params.id)
    const { name, description } = await req.json()
    if (!name?.trim()) return err('Name is required.')
    const [r] = await db.execute('UPDATE categories SET name=?, description=? WHERE id=?', [name.trim(), description||null, id])
    if (!r.affectedRows) return notFound('Category not found.')
    const [rows] = await db.execute('SELECT * FROM categories WHERE id=?', [id])
    return ok(rows[0])
  } catch (e) {
    if (e.code==='ER_DUP_ENTRY') return err('Category name already exists.', 409)
    return serverErr(e)
  }
})

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const id = parseInt(params.id)
    const [r] = await db.execute('DELETE FROM categories WHERE id=?', [id])
    if (!r.affectedRows) return notFound('Category not found.')
    return msg('Category deleted.')
  } catch (e) { return serverErr(e) }
})
