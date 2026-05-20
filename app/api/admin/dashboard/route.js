import { withAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, serverErr } from '@/lib/response'

export const GET = withAdmin(async () => {
  try {
    const [[summary]] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE is_active = 1) AS total_products,
        (SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock_quantity = 0) AS out_of_stock,
        (SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock_quantity <= low_stock_threshold AND stock_quantity > 0) AS low_stock,
        (SELECT COUNT(*) FROM users WHERE role = 'staff' AND is_active = 1) AS total_staff,
        (SELECT COUNT(*) FROM people WHERE type = 'customer') AS total_customers,
        (SELECT COUNT(*) FROM people WHERE type = 'supplier') AS total_suppliers,
        (SELECT COALESCE(SUM(total_amount),0) FROM sales) AS total_sales_amount,
        (SELECT COUNT(*) FROM sales) AS total_sales_count,
        (SELECT COALESCE(SUM(total_amount),0) FROM purchases) AS total_purchases_amount,
        (SELECT COUNT(*) FROM purchases) AS total_purchases_count,
        (SELECT COALESCE(SUM(total_amount),0) FROM returns WHERE status='approved') AS total_returns_amount,
        (SELECT COUNT(*) FROM returns) AS total_returns_count,
        (SELECT COUNT(*) FROM returns WHERE status='pending') AS pending_returns
    `)
    const [[today]] = await db.execute(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at)=CURDATE() THEN total_amount END),0) AS today_sales,
        COUNT(CASE WHEN DATE(created_at)=CURDATE() THEN 1 END) AS today_sales_count
      FROM sales
    `)
    const [staff_performance] = await db.execute(`
      SELECT u.id, u.name,
        COUNT(DISTINCT s.id) AS sales_count, COALESCE(SUM(s.total_amount),0) AS sales_amount,
        COUNT(DISTINCT p.id) AS purchases_count, COALESCE(SUM(p.total_amount),0) AS purchases_amount,
        COUNT(DISTINCT r.id) AS returns_count, COALESCE(SUM(CASE WHEN r.status='approved' THEN r.total_amount END),0) AS returns_amount
      FROM users u
      LEFT JOIN sales s ON s.staff_id=u.id
      LEFT JOIN purchases p ON p.staff_id=u.id
      LEFT JOIN returns r ON r.staff_id=u.id
      WHERE u.role='staff' AND u.is_active=1
      GROUP BY u.id,u.name ORDER BY sales_amount DESC
    `)
    const [low_stock_products] = await db.execute(
      'SELECT id,name,sku,stock_quantity,low_stock_threshold FROM products WHERE is_active=1 AND stock_quantity<=low_stock_threshold ORDER BY stock_quantity ASC LIMIT 10'
    )
    const [recent_sales] = await db.execute(`
      SELECT s.id,s.total_amount,s.created_at,u.name AS staff_name,p.name AS customer_name
      FROM sales s JOIN users u ON s.staff_id=u.id LEFT JOIN people p ON s.customer_id=p.id
      ORDER BY s.created_at DESC LIMIT 5
    `)
    const [pending_returns] = await db.execute(`
      SELECT r.id,r.total_amount,r.reason,r.created_at,u.name AS staff_name
      FROM returns r JOIN users u ON r.staff_id=u.id WHERE r.status='pending'
      ORDER BY r.created_at ASC LIMIT 10
    `)
    return ok({ summary: { ...summary, ...today }, staff_performance, low_stock_products, recent_sales, pending_returns })
  } catch (e) { return serverErr(e) }
})
