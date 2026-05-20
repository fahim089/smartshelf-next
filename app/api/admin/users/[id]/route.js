import bcrypt from 'bcryptjs'
import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, msg, err, notFound, serverErr } from '@/lib/response'

export const PUT = withAdmin(async (req, { params }, user) => {
  try {
    const { name, email, phone, role, is_active, password } = await req.json()
    if (parseInt(params.id) === user.id && is_active === false) return err('You cannot deactivate your own account.')
    const [ex] = await db.execute('SELECT id FROM users WHERE id=?', [params.id])
    if (!ex.length) return notFound()
    if (email) {
      const [dup] = await db.execute('SELECT id FROM users WHERE email=? AND id!=?', [email.toLowerCase(), params.id])
      if (dup.length) return err('Email already in use.', 409)
    }
    await db.execute(
      'UPDATE users SET name=COALESCE(?,name),email=COALESCE(?,email),phone=COALESCE(?,phone),role=COALESCE(?,role),is_active=COALESCE(?,is_active) WHERE id=?',
      [name||null, email?email.toLowerCase():null, phone||null, role||null, is_active!==undefined?(is_active?1:0):null, params.id]
    )
    if (password) {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
      const hash   = await bcrypt.hash(password, rounds)
      await db.execute('UPDATE users SET password_hash=? WHERE id=?', [hash, params.id])
    }
    const [rows] = await db.execute('SELECT id,name,email,phone,role,is_active FROM users WHERE id=?', [params.id])
    return ok(rows[0])
  } catch (e) { return serverErr(e) }
})

export const DELETE = withAdmin(async (req, { params }, user) => {
  try {
    if (parseInt(params.id) === user.id) return err('You cannot delete your own account.')
    const [r] = await db.execute('DELETE FROM users WHERE id=?', [params.id])
    if (!r.affectedRows) return notFound()
    return msg('User deleted.')
  } catch (e) { return serverErr(e) }
})
