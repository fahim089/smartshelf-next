import { withAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, serverErr } from '@/lib/response'

export const GET = withAuth(async (req, ctx, user) => {
  try {
    const id = user.id
    const [[todaySales]] = await db.execute(`SELECT COUNT(*) AS today_sales_count, COALESCE(SUM(total_amount),0) AS today_sales_amount FROM sales WHERE staff_id=? AND DATE(created_at)=CURDATE()`, [id])
    const [[totals]] = await db.execute(`SELECT
      COALESCE((SELECT SUM(total_amount) FROM sales WHERE staff_id=?),0) AS total_sales,
      COALESCE((SELECT COUNT(*) FROM sales WHERE staff_id=?),0) AS total_sales_count,
      COALESCE((SELECT SUM(total_amount) FROM purchases WHERE staff_id=?),0) AS total_purchases,
      COALESCE((SELECT COUNT(*) FROM purchases WHERE staff_id=?),0) AS total_purchases_count,
      COALESCE((SELECT SUM(total_amount) FROM returns WHERE staff_id=? AND status='approved'),0) AS total_returns,
      COALESCE((SELECT COUNT(*) FROM returns WHERE staff_id=?),0) AS total_returns_count,
      COALESCE((SELECT COUNT(*) FROM returns WHERE staff_id=? AND status='pending'),0) AS pending_returns
    `, [id,id,id,id,id,id,id])
    const net = parseFloat(totals.total_sales) - parseFloat(totals.total_purchases) - parseFloat(totals.total_returns)
    const [recent_sales] = await db.execute(`SELECT s.id,s.total_amount,s.created_at,p.name AS customer_name FROM sales s LEFT JOIN people p ON s.customer_id=p.id WHERE s.staff_id=? ORDER BY s.created_at DESC LIMIT 5`, [id])
    const [recent_purchases] = await db.execute(`SELECT pu.id,pu.total_amount,pu.created_at,p.name AS supplier_name FROM purchases pu LEFT JOIN people p ON pu.supplier_id=p.id WHERE pu.staff_id=? ORDER BY pu.created_at DESC LIMIT 5`, [id])
    const [my_pending_returns] = await db.execute(`SELECT id,total_amount,reason,status,created_at FROM returns WHERE staff_id=? AND status='pending' ORDER BY created_at DESC LIMIT 5`, [id])
    return ok({ today: todaySales, totals: { ...totals, net: net.toFixed(2) }, recent_sales, recent_purchases, my_pending_returns })
  } catch (e) { return serverErr(e) }
})
