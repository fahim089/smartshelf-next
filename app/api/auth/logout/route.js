import { withAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { msg, serverErr } from '@/lib/response'

export const POST = withAuth(async (req, ctx, user) => {
  try {
    await db.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [user.id])
    return msg('Logged out.')
  } catch (e) { return serverErr(e) }
})
