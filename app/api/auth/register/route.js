import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { ok, err, serverErr } from '@/lib/response'

export async function POST(req) {
  try {
    const { name, email, phone, password } = await req.json()
    if (!name || !email || !password) return err('Name, email and password are required.')
    if (password.length < 8) return err('Password must be at least 8 characters.')

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
    if (existing.length) return err('Email already registered.', 409)

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const hash   = await bcrypt.hash(password, rounds)

    const [result] = await db.execute(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email.toLowerCase(), phone || null, hash, 'staff']
    )
    const userId = result.insertId
    const accessToken  = generateAccessToken(userId)
    const refreshToken = generateRefreshToken(userId)
    await db.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, userId])

    return ok({ access_token: accessToken, refresh_token: refreshToken, user: { id: userId, name, email, phone, role: 'staff', is_active: 1 } }, 201)
  } catch (e) { return serverErr(e) }
}
