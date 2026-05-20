import { withAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, serverErr } from '@/lib/response'

export const PUT = withAuth(async (req, ctx, user) => {
  try {
    const { name, email, phone } = await req.json()
    if (email) {
      const [dup] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), user.id])
      if (dup.length) return err('Email already in use.', 409)
    }
    await db.execute(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE id = ?',
      [name || null, email ? email.toLowerCase() : null, phone !== undefined ? phone : null, user.id]
    )
    const [rows] = await db.execute('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [user.id])
    return ok(rows[0])
  } catch (e) { return serverErr(e) }
})
