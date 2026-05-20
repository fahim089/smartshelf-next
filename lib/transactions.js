import { db } from './db'

export async function fetchSale(id) {
  const [sales] = await db.execute(
    `SELECT s.id,s.total_amount,s.note,s.created_at,u.id AS staff_id,u.name AS staff_name,p.id AS customer_id,p.name AS customer_name
     FROM sales s JOIN users u ON s.staff_id=u.id LEFT JOIN people p ON s.customer_id=p.id WHERE s.id=?`, [id]
  )
  if (!sales.length) return null
  const [items] = await db.execute(
    `SELECT si.id,si.quantity,si.unit_price,si.subtotal,pr.id AS product_id,pr.name AS product_name,pr.sku
     FROM sale_items si JOIN products pr ON si.product_id=pr.id WHERE si.sale_id=?`, [id]
  )
  return { ...sales[0], items }
}

export async function fetchPurchase(id) {
  const [purchases] = await db.execute(
    `SELECT pu.id,pu.total_amount,pu.note,pu.created_at,u.id AS staff_id,u.name AS staff_name,p.id AS supplier_id,p.name AS supplier_name
     FROM purchases pu JOIN users u ON pu.staff_id=u.id LEFT JOIN people p ON pu.supplier_id=p.id WHERE pu.id=?`, [id]
  )
  if (!purchases.length) return null
  const [items] = await db.execute(
    `SELECT pi.id,pi.quantity,pi.unit_price,pi.subtotal,pr.id AS product_id,pr.name AS product_name,pr.sku
     FROM purchase_items pi JOIN products pr ON pi.product_id=pr.id WHERE pi.purchase_id=?`, [id]
  )
  return { ...purchases[0], items }
}

export async function fetchReturn(id) {
  const [returns] = await db.execute(
    `SELECT r.id,r.total_amount,r.reason,r.status,r.created_at,r.sale_id,u.id AS staff_id,u.name AS staff_name
     FROM returns r JOIN users u ON r.staff_id=u.id WHERE r.id=?`, [id]
  )
  if (!returns.length) return null
  const [items] = await db.execute(
    `SELECT ri.id,ri.quantity,ri.unit_price,ri.subtotal,pr.id AS product_id,pr.name AS product_name,pr.sku
     FROM return_items ri JOIN products pr ON ri.product_id=pr.id WHERE ri.return_id=?`, [id]
  )
  return { ...returns[0], items }
}

export async function listSales({ isAdmin, staffId, staffFilter, dateFrom, dateTo, page=1, limit=20 }) {
  const offset = (page-1)*limit
  const conds=[], args=[]
  if (!isAdmin) { conds.push('s.staff_id=?'); args.push(staffId) }
  else if (staffFilter) { conds.push('s.staff_id=?'); args.push(staffFilter) }
  if (dateFrom) { conds.push('DATE(s.created_at)>=?'); args.push(dateFrom) }
  if (dateTo)   { conds.push('DATE(s.created_at)<=?'); args.push(dateTo) }
  const where = conds.length ? 'WHERE '+conds.join(' AND ') : ''
  const [[{total}]] = await db.execute(`SELECT COUNT(*) AS total FROM sales s ${where}`, args)
  const [rows] = await db.execute(
    `SELECT s.id,s.total_amount,s.note,s.created_at,u.id AS staff_id,u.name AS staff_name,pe.id AS customer_id,pe.name AS customer_name
     FROM sales s JOIN users u ON s.staff_id=u.id LEFT JOIN people pe ON s.customer_id=pe.id
     ${where} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
    [...args, parseInt(limit), offset]
  )
  return { data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total/limit) } }
}

export async function listPurchases({ isAdmin, staffId, staffFilter, dateFrom, dateTo, page=1, limit=20 }) {
  const offset = (page-1)*limit
  const conds=[], args=[]
  if (!isAdmin) { conds.push('pu.staff_id=?'); args.push(staffId) }
  else if (staffFilter) { conds.push('pu.staff_id=?'); args.push(staffFilter) }
  if (dateFrom) { conds.push('DATE(pu.created_at)>=?'); args.push(dateFrom) }
  if (dateTo)   { conds.push('DATE(pu.created_at)<=?'); args.push(dateTo) }
  const where = conds.length ? 'WHERE '+conds.join(' AND ') : ''
  const [[{total}]] = await db.execute(`SELECT COUNT(*) AS total FROM purchases pu ${where}`, args)
  const [rows] = await db.execute(
    `SELECT pu.id,pu.total_amount,pu.note,pu.created_at,u.id AS staff_id,u.name AS staff_name,pe.id AS supplier_id,pe.name AS supplier_name
     FROM purchases pu JOIN users u ON pu.staff_id=u.id LEFT JOIN people pe ON pu.supplier_id=pe.id
     ${where} ORDER BY pu.created_at DESC LIMIT ? OFFSET ?`,
    [...args, parseInt(limit), offset]
  )
  return { data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total/limit) } }
}

export async function listReturns({ isAdmin, staffId, staffFilter, status, page=1, limit=20 }) {
  const offset = (page-1)*limit
  const conds=[], args=[]
  if (!isAdmin) { conds.push('r.staff_id=?'); args.push(staffId) }
  else if (staffFilter) { conds.push('r.staff_id=?'); args.push(staffFilter) }
  if (status) { conds.push('r.status=?'); args.push(status) }
  const where = conds.length ? 'WHERE '+conds.join(' AND ') : ''
  const [[{total}]] = await db.execute(`SELECT COUNT(*) AS total FROM returns r ${where}`, args)
  const [rows] = await db.execute(
    `SELECT r.id,r.total_amount,r.reason,r.status,r.created_at,r.sale_id,u.id AS staff_id,u.name AS staff_name
     FROM returns r JOIN users u ON r.staff_id=u.id ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...args, parseInt(limit), offset]
  )
  return { data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total/limit) } }
}
