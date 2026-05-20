import bcrypt from 'bcryptjs'
import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, created, err, serverErr } from '@/lib/response'

export const GET = withAdmin(async () => {
  try {
    const [rows] = await db.execute('SELECT id,name,email,phone,role,is_active,created_at FROM users ORDER BY role,name')
    return ok(rows)
  } catch (e) { return serverErr(e) }
})

export const POST = withAdmin(async (req) => {
  try {
    const { name, email, phone, password, role='staff' } = await req.json()
    if (!name || !email || !password) return err('Name, email and password are required.')
    const [dup] = await db.execute('SELECT id FROM users WHERE email=?', [email.toLowerCase()])
    if (dup.length) return err('Email already registered.', 409)
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    const hash   = await bcrypt.hash(password, rounds)
    const [r] = await db.execute('INSERT INTO users (name,email,phone,password_hash,role) VALUES (?,?,?,?,?)', [name, email.toLowerCase(), phone||null, hash, role])
    return created({ id: r.insertId, name, email, phone, role, is_active: 1 })
  } catch (e) { return serverErr(e) }
})
