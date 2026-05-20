import { withAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, ctx, user) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [user.id]
    )
    return ok(rows[0])
  } catch (e) { return serverErr(e) }
})
