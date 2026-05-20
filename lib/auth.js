import jwt from 'jsonwebtoken'
import { db } from './db'

export function generateAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

export function generateRefreshToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  })
}

/**
 * Extracts Bearer token from request, verifies it, returns user.
 * Returns { user } on success or { error, status } on failure.
 */
export async function authenticate(req) {
  const header = req.headers.get('authorization')
  const token  = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return { error: 'Access token required.', status: 401 }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const [rows]  = await db.execute(
      'SELECT id, name, email, phone, role, is_active FROM users WHERE id = ?',
      [payload.sub]
    )
    if (!rows.length || !rows[0].is_active) {
      return { error: 'Account not found or disabled.', status: 401 }
    }
    return { user: rows[0] }
  } catch (err) {
    if (err.name === 'TokenExpiredError') return { error: 'Token expired.', status: 401 }
    return { error: 'Invalid token.', status: 401 }
  }
}

/** Wraps an API handler with auth check. Passes user as second arg. */
export function withAuth(handler) {
  return async (req, ctx) => {
    const result = await authenticate(req)
    if (result.error) {
      return Response.json({ success: false, message: result.error }, { status: result.status })
    }
    return handler(req, ctx, result.user)
  }
}

/** Wraps an API handler requiring admin role. */
export function withAdmin(handler) {
  return withAuth(async (req, ctx, user) => {
    if (user.role !== 'admin') {
      return Response.json({ success: false, message: 'Admin access required.' }, { status: 403 })
    }
    return handler(req, ctx, user)
  })
}
