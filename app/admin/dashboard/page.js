'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package, ShoppingCart, Truck, RotateCcw,
  Users, Tag, TrendingUp, AlertTriangle, ArrowRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { adminAPI } from '@/lib/api'
import { formatCurrency, formatDateTime, padId } from '@/lib/utils'
import { LoadingState } from '@/components/shared/ui'

const chartData = [
  { day: 'Mon', sales: 420, purchases: 180 },
  { day: 'Tue', sales: 680, purchases: 220 },
  { day: 'Wed', sales: 340, purchases: 400 },
  { day: 'Thu', sales: 790, purchases: 150 },
  { day: 'Fri', sales: 560, purchases: 300 },
  { day: 'Sat', sales: 920, purchases: 90  },
  { day: 'Sun', sales: 410, purchases: 60  },
]

function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ background: iconBg }}>
          <Icon size={18} color={iconColor} />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    adminAPI.dashboard()
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState text="Loading dashboard…" />
  if (error)   return <div className="alert alert-danger" style={{ marginTop: 24 }}><AlertTriangle size={16} /> {error}</div>

  const s = data?.summary || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stat grid */}
      <div className="stat-grid">
        <StatCard label="Total Products"  value={s.total_products || 0}               icon={Package}      iconBg="#dcfce7" iconColor="#16a34a" sub="In catalogue" />
        <StatCard label="Total Staff"     value={s.total_staff || 0}                   icon={Users}        iconBg="#dbeafe" iconColor="#2563eb" sub="Active accounts" />
        <StatCard label="Today's Sales"   value={formatCurrency(s.today_sales)}        icon={ShoppingCart} iconBg="#f0fdf4" iconColor="#15803d" sub={`${s.today_sales_count || 0} transactions`} />
        <StatCard label="Total Sales"     value={formatCurrency(s.total_sales_amount)} icon={TrendingUp}   iconBg="#dcfce7" iconColor="#16a34a" sub={`${s.total_sales_count || 0} all time`} />
        <StatCard label="Total Purchases" value={formatCurrency(s.total_purchases_amount)} icon={Truck}   iconBg="#fef3c7" iconColor="#d97706" sub={`${s.total_purchases_count || 0} orders`} />
        <StatCard label="Total Returns"   value={formatCurrency(s.total_returns_amount)}  icon={RotateCcw} iconBg="#fee2e2" iconColor="#dc2626" sub={`${s.total_returns_count || 0} returns`} />
        <StatCard label="Pending Returns" value={s.pending_returns || 0}               icon={AlertTriangle} iconBg="#fef3c7" iconColor="#d97706" sub="Awaiting review" />
        <StatCard label="Customers"       value={s.total_customers || 0}               icon={Tag}          iconBg="#f3e8ff" iconColor="#9333ea" sub={`${s.total_suppliers || 0} suppliers`} />
      </div>

      {/* Chart + Low stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Weekly Overview</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 7 days</span>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPurch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: 'var(--sidebar-bg)', border: 'none', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                  formatter={(v, name) => [formatCurrency(v), name === 'sales' ? 'Sales' : 'Purchases']} />
                <Area type="monotone" dataKey="sales"     stroke="#16a34a" strokeWidth={2} fill="url(#gSales)" />
                <Area type="monotone" dataKey="purchases" stroke="#2563eb" strokeWidth={2} fill="url(#gPurch)" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {[['Sales', '#16a34a'], ['Purchases', '#2563eb']].map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ width: 10, height: 3, background: c, borderRadius: 2 }} />{l}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} color="var(--warning)" /> Low Stock
            </span>
            {data?.low_stock_products?.length > 0 && <span className="badge badge-warning">{data.low_stock_products.length}</span>}
          </div>
          {!data?.low_stock_products?.length ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>✓ All stock levels healthy</div>
          ) : (
            <>
              {data.low_stock_products.slice(0, 8).map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{p.name}</div>
                  <span className={`badge ${p.stock_quantity <= 0 ? 'badge-danger' : 'badge-warning'}`}>{p.stock_quantity} left</span>
                </div>
              ))}
              {data.low_stock_products.length > 8 && (
                <div style={{ padding: '9px 16px', borderTop: '1px solid var(--border)' }}>
                  <Link href="/admin/products" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={12} /></Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Staff performance */}
      {data?.staff_performance?.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Staff Performance</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff</th><th>Sales</th><th>Sales $</th><th>Purchases</th><th>Purchases $</th><th>Returns</th><th>Returns $</th></tr></thead>
              <tbody>
                {data.staff_performance.map(st => (
                  <tr key={st.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{st.name[0].toUpperCase()}</div>
                        <span style={{ fontWeight: 500 }}>{st.name}</span>
                      </div>
                    </td>
                    <td>{st.sales_count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(st.sales_amount)}</td>
                    <td>{st.purchases_count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--warning)' }}>{formatCurrency(st.purchases_amount)}</td>
                    <td>{st.returns_count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(st.returns_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent sales */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Sales</span>
          <Link href="/admin/sales" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={12} /></Link>
        </div>
        {!data?.recent_sales?.length ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No sales recorded yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Staff</th><th>Customer</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {data.recent_sales.map(s => (
                  <tr key={s.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{padId(s.id)}</span></td>
                    <td style={{ fontWeight: 500 }}>{s.staff_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.customer_name || <span style={{ color: 'var(--text-muted)' }}>Walk-in</span>}</td>
                    <td><span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(s.total_amount)}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDateTime(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
