import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { ok, err, serverErr } from '@/lib/response'

export async function POST(req) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return err('Email and password required.')

    const [rows] = await db.execute(
      'SELECT id, name, email, phone, role, password_hash, is_active FROM users WHERE email = ?',
      [email.toLowerCase()]
    )
    if (!rows.length) return err('Invalid email or password.', 401)

    const user = rows[0]
    if (!user.is_active) return err('Your account is disabled.', 403)

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return err('Invalid email or password.', 401)

    const accessToken  = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    await db.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id])

    const { password_hash, ...safe } = user
    return ok({ access_token: accessToken, refresh_token: refreshToken, user: safe })
  } catch (e) { return serverErr(e) }
}
