import bcrypt from 'bcryptjs'
import { withAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { msg, err, serverErr } from '@/lib/response'

export const POST = withAuth(async (req, ctx, user) => {
  try {
    const { current_password, new_password } = await req.json()
    if (!current_password || !new_password) return err('Both fields required.')
    if (new_password.length < 8) return err('New password must be at least 8 characters.')

    const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [user.id])
    const valid  = await bcrypt.compare(current_password, rows[0].password_hash)
    if (!valid) return err('Current password is incorrect.', 401)

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const hash   = await bcrypt.hash(new_password, rounds)
    await db.execute('UPDATE users SET password_hash = ?, refresh_token = NULL WHERE id = ?', [hash, user.id])
    return msg('Password changed. Please log in again.')
  } catch (e) { return serverErr(e) }
})
