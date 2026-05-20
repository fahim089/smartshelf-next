'use client'
import { useState, useEffect, useCallback } from 'react'
import { Truck, Plus, Eye, Minus } from 'lucide-react'
import { staffAPI } from '@/lib/api'
import { formatCurrency, formatDateTime, getErrMsg, padId } from '@/lib/utils'
import { useToast } from '@/components/shared/Toast'
import { Modal, LoadingState, EmptyState, ErrorAlert } from '@/components/shared/ui'

export default function StaffPurchases() {
  const { show } = useToast()
  const [purchases, setPurchases]   = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [products, setProducts]     = useState([])
  const [note, setNote]             = useState('')
  const [items, setItems]           = useState([{ product_id: '', quantity: 1, unit_price: '' }])
  const [saving, setSaving]         = useState(false)
  const [formErr, setFormErr]       = useState('')

  const load = useCallback(() => {
    setLoading(true)
    staffAPI.getPurchases({ page, limit: 15 })
      .then(r => { setPurchases(r.data.data); setPagination(r.data.pagination) })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const openCreate = async () => {
    setFormErr(''); setNote('')
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
        if (p) next[i].unit_price = p.cost_price || p.price
      }
      return next
    })
  }
  const addItem    = () => setItems(p => [...p, { product_id: '', quantity: 1, unit_price: '' }])
  const removeItem = i  => setItems(p => p.filter((_, idx) => idx !== i))
  const total = items.reduce((s, it) => s + (parseFloat(it.unit_price || 0) * parseInt(it.quantity || 0)), 0)

  const handleCreate = async () => {
    const valid = items.filter(it => it.product_id && it.quantity > 0 && it.unit_price !== '')
    if (!valid.length) { setFormErr('Add at least one product with a cost.'); return }
    setSaving(true); setFormErr('')
    try {
      await staffAPI.createPurchase({
        note: note || undefined,
        items: valid.map(it => ({ product_id: parseInt(it.product_id), quantity: parseInt(it.quantity), unit_price: parseFloat(it.unit_price) })),
      })
      show('Purchase recorded. Stock updated.', 'success')
      setCreateOpen(false); load()
    } catch (e) { setFormErr(getErrMsg(e)) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>My Purchases</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{pagination.total || 0} total purchases</p>
        </div>
        <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={openCreate}><Plus size={15} /> New Purchase</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? <LoadingState /> : purchases.length === 0 ? (
          <EmptyState icon={<Truck size={40} />} title="No purchases yet" description="Record your first purchase." action={<button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={openCreate}><Plus size={14} /> New Purchase</button>} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Amount</th><th>Supplier</th><th>Note</th><th>Date</th></tr></thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>{padId(p.id)}</span></td>
                    <td><span style={{ fontWeight: 700, color: '#d97706' }}>{formatCurrency(p.total_amount)}</span></td>
                    <td style={{ color: '#64748b' }}>{p.supplier_name || '—'}</td>
                    <td style={{ color: '#64748b' }}>{p.note || '—'}</td>
                    <td style={{ color: '#94a3b8' }}>{formatDateTime(p.created_at)}</td>
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

      <Modal open={createOpen} title="New Purchase" onClose={() => setCreateOpen(false)} maxWidth={540}
        footer={<>
          <div style={{ flex: 1, fontWeight: 700, color: '#d97706' }}>Total: {formatCurrency(total)}</div>
          <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Record purchase'}</button>
        </>}>
        <ErrorAlert message={formErr} />
        <div className="form-group"><label className="form-label">Note (optional)</label><input className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" /></div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>ITEMS</span>
            <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={13} /> Add item</button>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 32px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
              <select className="form-select" value={item.product_id} onChange={e => setItemField(i, 'product_id', e.target.value)}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="form-input" type="number" min="1" value={item.quantity} onChange={e => setItemField(i, 'quantity', e.target.value)} placeholder="Qty" />
              <input className="form-input" type="number" min="0" step="0.01" value={item.unit_price} onChange={e => setItemField(i, 'unit_price', e.target.value)} placeholder="Cost" />
              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeItem(i)} disabled={items.length === 1}><Minus size={13} /></button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
