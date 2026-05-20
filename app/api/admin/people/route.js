import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, created, err, serverErr } from '@/lib/response'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const conds = [], args = []
    if (searchParams.get('type'))   { conds.push('type=?');                            args.push(searchParams.get('type')) }
    if (searchParams.get('search')) { conds.push('(name LIKE ? OR email LIKE ?)');     const t=`%${searchParams.get('search')}%`; args.push(t,t) }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const [rows] = await db.execute(`SELECT * FROM people ${where} ORDER BY type,name`, args)
    return ok(rows)
  } catch (e) { return serverErr(e) }
})

export const POST = withAdmin(async (req) => {
  try {
    const { type, name, email, phone, address, note } = await req.json()
    if (!type || !name) return err('Type and name are required.')
    if (!['customer','supplier'].includes(type)) return err('Type must be customer or supplier.')
    const [r] = await db.execute(
      'INSERT INTO people (type,name,email,phone,address,note) VALUES (?,?,?,?,?,?)',
      [type, name, email||null, phone||null, address||null, note||null]
    )
    const [rows] = await db.execute('SELECT * FROM people WHERE id=?', [r.insertId])
    return created(rows[0])
  } catch (e) { return serverErr(e) }
})
