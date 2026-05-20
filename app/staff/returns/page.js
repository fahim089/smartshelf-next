'use client'
import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Plus, Minus } from 'lucide-react'
import { staffAPI } from '@/lib/api'
import { formatCurrency, formatDateTime, getErrMsg, padId } from '@/lib/utils'
import { useToast } from '@/components/shared/Toast'
import { Modal, LoadingState, EmptyState, ErrorAlert } from '@/components/shared/ui'

const STATUS_BADGE = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' }

export default function StaffReturns() {
  const { show } = useToast()
  const [returns, setReturns]       = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [products, setProducts]     = useState([])
  const [reason, setReason]         = useState('')
  const [items, setItems]           = useState([{ product_id: '', quantity: 1, unit_price: '' }])
  const [saving, setSaving]         = useState(false)
  const [formErr, setFormErr]       = useState('')

  const load = useCallback(() => {
    setLoading(true)
    staffAPI.getReturns({ page, limit: 15 })
      .then(r => { setReturns(r.data.data); setPagination(r.data.pagination) })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const openCreate = async () => {
    setFormErr(''); setReason('')
    setItems([{ product_id: '', quantity: 1, unit_price: '' }])
    try { const p = await staffAPI.getProducts({ limit: 200 }); setProducts(p.data.data) }
    catch (e) { show(getErrMsg(e), 'danger'); return }
    setCreateOpen(true)
  }

  const setItemField = (i, field, val) => {
    setItems(prev => {
      const next = [...prev]; next[i] = { ...next[i], [field]: val }
      if (field === 'product_id' && val) {
        const p = products.find(p => String(p.id) === String(val))
        if (p) next[i].unit_price = p.price
      }
      return next
    })
  }
  const addItem    = () => setItems(p => [...p, { product_id: '', quantity: 1, unit_price: '' }])
  const removeItem = i  => setItems(p => p.filter((_, idx) => idx !== i))
  const total = items.reduce((s, it) => s + (parseFloat(it.unit_price || 0) * parseInt(it.quantity || 0)), 0)

  const handleCreate = async () => {
    const valid = items.filter(it => it.product_id && it.quantity > 0)
    if (!valid.length) { setFormErr('Add at least one item.'); return }
    setSaving(true); setFormErr('')
    try {
      await staffAPI.createReturn({
        reason: reason || undefined,
        items: valid.map(it => ({ product_id: parseInt(it.product_id), quantity: parseInt(it.quantity), unit_price: parseFloat(it.unit_price) })),
      })
      show('Return submitted to admin for review.', 'success')
      setCreateOpen(false); load()
    } catch (e) { setFormErr(getErrMsg(e)) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>My Returns</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{pagination.total || 0} returns · sent to admin for approval</p>
        </div>
        <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={openCreate}><Plus size={15} /> New Return</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? <LoadingState /> : returns.length === 0 ? (
          <EmptyState icon={<RotateCcw size={40} />} title="No returns yet" description="Submit a return to admin for approval." action={<button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={openCreate}><Plus size={14} /> New Return</button>} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>{padId(r.id)}</span></td>
                    <td><span style={{ fontWeight: 700, color: '#d97706' }}>{formatCurrency(r.total_amount)}</span></td>
                    <td style={{ color: '#64748b' }}>{r.reason || '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{r.status}</span></td>
                    <td style={{ color: '#94a3b8' }}>{formatDateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)} className="btn btn-sm"
              style={{ background: n===page?'#16a34a':'#fff', color:n===page?'#fff':'#475569', border:'1px solid #e2e8f0', minWidth:32 }}>{n}</button>
          ))}
        </div>
      )}

      <Modal open={createOpen} title="New Return" onClose={() => setCreateOpen(false)} maxWidth={540}
        footer={<>
          <div style={{ flex: 1, fontWeight: 700, color: '#d97706' }}>Return total: {formatCurrency(total)}</div>
          <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={handleCreate} disabled={saving}>{saving ? 'Submitting…' : 'Submit Return'}</button>
        </>}>
        <ErrorAlert message={formErr} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
          Returns are sent to admin for approval. Stock will be restored once approved.
        </p>
        <div className="form-group"><label className="form-label">Reason *</label><textarea className="form-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why items are being returned…" style={{ minHeight: 60 }} /></div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>ITEMS TO RETURN</span>
            <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={13} /> Add item</button>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 32px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <select className="form-select" value={item.product_id} onChange={e => setItemField(i, 'product_id', e.target.value)}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="form-input" type="number" min="1" value={item.quantity} onChange={e => setItemField(i, 'quantity', e.target.value)} placeholder="Qty" />
              <input className="form-input" type="number" min="0" step="0.01" value={item.unit_price} onChange={e => setItemField(i, 'unit_price', e.target.value)} placeholder="Price" />
              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeItem(i)} disabled={items.length === 1}><Minus size={13} /></button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
