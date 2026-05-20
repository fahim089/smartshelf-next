import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, msg, notFound, serverErr } from '@/lib/response'

export const PUT = withAdmin(async (req, { params }) => {
  try {
    const { type,name,email,phone,address,note } = await req.json()
    const [r] = await db.execute(
      'UPDATE people SET type=COALESCE(?,type),name=COALESCE(?,name),email=COALESCE(?,email),phone=COALESCE(?,phone),address=COALESCE(?,address),note=COALESCE(?,note) WHERE id=?',
      [type||null,name||null,email||null,phone||null,address||null,note||null,params.id]
    )
    if (!r.affectedRows) return notFound()
    const [rows] = await db.execute('SELECT * FROM people WHERE id=?', [params.id])
    return ok(rows[0])
  } catch (e) { return serverErr(e) }
})

export const DELETE = withAdmin(async (req, { params }) => {
  try {
    const [r] = await db.execute('DELETE FROM people WHERE id=?', [params.id])
    if (!r.affectedRows) return notFound()
    return msg('Deleted.')
  } catch (e) { return serverErr(e) }
})
