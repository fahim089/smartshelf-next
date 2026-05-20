import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, msg, notFound, serverErr } from '@/lib/response'

export const PUT = withAdmin(async (req, { params }) => {
  try {
    const id = parseInt(params.id)
    const { type, name, email, phone, address, note } = await req.json()
    await db.execute(
      'UPDATE people SET type=COALESCE(?,type), name=COALESCE(?,name), email=COALESCE(?,email), phone=COALESCE(?,phone), address=COALESCE(?,address), note=COALESCE(?,note) WHERE id=?',
      [type||null, name||null, email||null, phone||null, address||null, note||null, id]
    )
    const [rows] = await db.execute('SELECT * FROM people WHERE id=?', [id])
    if (!rows.length) return notFound('Person not found.')
    return ok(rows[0])
  } catch (e) { return serverErr(e) }
})

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const id = parseInt(params.id)
    const [r] = await db.execute('DELETE FROM people WHERE id=?', [id])
    if (!r.affectedRows) return notFound('Person not found.')
    return msg('Deleted successfully.')
  } catch (e) { return serverErr(e) }
})
