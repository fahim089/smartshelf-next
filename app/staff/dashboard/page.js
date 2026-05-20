'use client'
import { useEffect, useState } from 'react'
import { ShoppingCart, Truck, RotateCcw, TrendingUp, AlertTriangle } from 'lucide-react'
import { staffAPI } from '@/lib/api'
import { formatCurrency, formatDateTime, padId } from '@/lib/utils'
import { LoadingState } from '@/components/shared/ui'
import useAuthStore from '@/store/authStore'

function StatCard({ label, value, icon: Icon, iconBg, iconColor, sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={iconColor} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

export default function StaffDashboard() {
  const { user } = useAuthStore()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    staffAPI.dashboard()
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState text="Loading dashboard…" />
  if (error)   return <div className="alert alert-danger" style={{ marginTop: 24 }}><AlertTriangle size={16} /> {error}</div>

  const t = data?.totals   || {}
  const today = data?.today || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Good day, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Here's your personal summary</p>
      </div>

      {/* Today */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Today</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <StatCard label="Today's Sales"        value={formatCurrency(today.today_sales_amount)} icon={ShoppingCart} iconBg="#dcfce7" iconColor="#16a34a" sub={`${today.today_sales_count || 0} transactions`} />
          <StatCard label="Today's Transactions" value={today.today_sales_count || 0}             icon={TrendingUp}   iconBg="#dbeafe" iconColor="#2563eb" sub="sales made today" />
        </div>
      </div>

      {/* All time */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>All Time</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <StatCard label="Total Sales"     value={formatCurrency(t.total_sales)}     icon={ShoppingCart} iconBg="#dcfce7" iconColor="#16a34a" sub={`${t.total_sales_count || 0} sales`} />
          <StatCard label="Total Purchases" value={formatCurrency(t.total_purchases)} icon={Truck}        iconBg="#fef3c7" iconColor="#d97706" sub={`${t.total_purchases_count || 0} orders`} />
          <StatCard label="Total Returns"   value={formatCurrency(t.total_returns)}   icon={RotateCcw}    iconBg="#fee2e2" iconColor="#dc2626" sub={`${t.total_returns_count || 0} returns`} />
          <StatCard label="Net Amount"      value={formatCurrency(t.net || 0)}        icon={TrendingUp}   iconBg="#f3e8ff" iconColor="#9333ea" sub="sales − purchases − returns" />
        </div>
      </div>

      {/* Pending returns warning */}
      {parseInt(t.pending_returns) > 0 && (
        <div style={{ padding: '12px 16px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#854d0e', fontWeight: 500 }}>
          <AlertTriangle size={15} />
          You have <strong>{t.pending_returns}</strong> pending return{parseInt(t.pending_returns) > 1 ? 's' : ''} awaiting admin review.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent sales */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Recent Sales</div>
          {!data?.recent_sales?.length ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No sales yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Customer</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>
                  {data.recent_sales.map(s => (
                    <tr key={s.id}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>{padId(s.id)}</span></td>
                      <td style={{ color: '#475569' }}>{s.customer_name || <span style={{ color: '#94a3b8' }}>Walk-in</span>}</td>
                      <td><span style={{ fontWeight: 600, color: '#16a34a' }}>{formatCurrency(s.total_amount)}</span></td>
                      <td style={{ color: '#94a3b8', fontSize: 12 }}>{formatDateTime(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent purchases */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Recent Purchases</div>
          {!data?.recent_purchases?.length ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No purchases yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Supplier</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>
                  {data.recent_purchases.map(p => (
                    <tr key={p.id}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>{padId(p.id)}</span></td>
                      <td style={{ color: '#475569' }}>{p.supplier_name || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                      <td><span style={{ fontWeight: 600, color: '#d97706' }}>{formatCurrency(p.total_amount)}</span></td>
                      <td style={{ color: '#94a3b8', fontSize: 12 }}>{formatDateTime(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
