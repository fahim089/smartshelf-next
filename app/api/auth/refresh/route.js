import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { ok, err, serverErr } from '@/lib/response'

export async function POST(req) {
  try {
    const { refresh_token } = await req.json()
    if (!refresh_token) return err('refresh_token required.')

    let payload
    try { payload = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET) }
    catch { return err('Invalid or expired refresh token.', 401) }

    const [rows] = await db.execute('SELECT id, refresh_token, is_active FROM users WHERE id = ?', [payload.sub])
    if (!rows.length || rows[0].refresh_token !== refresh_token || !rows[0].is_active) {
      return err('Refresh token revoked.', 401)
    }

    const newAccess  = generateAccessToken(payload.sub)
    const newRefresh = generateRefreshToken(payload.sub)
    await db.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefresh, payload.sub])
    return ok({ access_token: newAccess, refresh_token: newRefresh })
  } catch (e) { return serverErr(e) }
}
