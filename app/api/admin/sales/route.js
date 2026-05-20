import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { listSales, fetchSale } from '@/lib/transactions'
import { serverErr, err } from '@/lib/response'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const result = await listSales({
      isAdmin: true,
      staffFilter: searchParams.get('staff_id'),
      dateFrom: searchParams.get('date_from'),
      dateTo:   searchParams.get('date_to'),
      page:     searchParams.get('page') || 1,
      limit:    searchParams.get('limit') || 20,
    })
    return Response.json({ success: true, ...result })
  } catch (e) { return serverErr(e) }
})

export const POST = withAdmin(async (req, ctx, user) => {
  try {
    const { customer_id, note, items, staff_id: body_staff_id } = await req.json()
    if (!items?.length) return err('Sale must have at least one item.')

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      let totalAmount = 0
      for (const item of items) {
        const [rows] = await conn.execute('SELECT id,stock_quantity,price FROM products WHERE id=? AND is_active=1', [item.product_id])
        if (!rows.length) { await conn.rollback(); return err(`Product ${item.product_id} not found.`, 404) }
        if (rows[0].stock_quantity < item.quantity) { await conn.rollback(); return err(`Insufficient stock for product ID ${item.product_id}.`) }
        item._unit_price = item.unit_price ?? rows[0].price
        totalAmount += item._unit_price * item.quantity
      }
      const effectiveStaffId = body_staff_id || user.id
      const [sr] = await conn.execute('INSERT INTO sales (staff_id,customer_id,total_amount,note) VALUES (?,?,?,?)', [effectiveStaffId, customer_id||null, totalAmount, note||null])
      for (const item of items) {
        await conn.execute('INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?)', [sr.insertId, item.product_id, item.quantity, item._unit_price, item._unit_price*item.quantity])
        await conn.execute('UPDATE products SET stock_quantity=stock_quantity-? WHERE id=?', [item.quantity, item.product_id])
      }
      await conn.commit()
      const sale = await fetchSale(sr.insertId)
      return Response.json({ success: true, data: sale }, { status: 201 })
    } catch (e) { await conn.rollback(); throw e }
    finally { conn.release() }
  } catch (e) { return serverErr(e) }
})
