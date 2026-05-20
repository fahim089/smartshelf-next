'use client'
import { useState, useEffect, useCallback } from 'react'
import { Truck, Plus, Search, Trash2, Eye, X, Minus } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import { formatCurrency, formatDateTime, getErrMsg, padId } from '@/lib/utils'
import { useToast } from '@/components/shared/Toast'
import { Modal, ConfirmModal, LoadingState, EmptyState, ErrorAlert } from '@/components/shared/ui'

export default function AdminPurchases() {
  const { show } = useToast()
  const [purchases, setPurchases]   = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [from, setFrom]             = useState('')
  const [to, setTo]                 = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewPurchase, setViewPurchase] = useState(null)
  const [delTarget, setDelTarget]   = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [users, setUsers]           = useState([])
  const [suppliers, setSuppliers]   = useState([])
  const [products, setProducts]     = useState([])
  const [staffId, setStaffId]       = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [note, setNote]             = useState('')
  const [items, setItems]           = useState([{ product_id: '', quantity: 1, unit_price: '' }])
  const [saving, setSaving]         = useState(false)
  const [formErr, setFormErr]       = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { page, limit: 20 }
      if (from) params.date_from = from
      if (to)   params.date_to   = to
      const r = await adminAPI.getPurchases(params)
      setPurchases(r.data.data); setPagination(r.data.pagination)
    } catch (e) { setError(getErrMsg(e)) }
    finally { setLoading(false) }
  }, [page, from, to])

  useEffect(() => { load() }, [load])

  const openCreate = async () => {
    setFormErr(''); setStaffId(''); setSupplierId(''); setNote('')
    setItems([{ product_id: '', quantity: 1, unit_price: '' }])
    try {
      const [u, s, p] = await Promise.all([adminAPI.getUsers(), adminAPI.getPeople({ type: 'supplier' }), adminAPI.getProducts({ limit: 200 })])
      setUsers(u.data.data.filter(u => u.is_active)); setSuppliers(s.data.data); setProducts(p.data.data)
    } catch (e) { show(getErrMsg(e), 'danger'); return }
    setCreateOpen(true)
  }

  const openView = async p => {
    try { const r = await adminAPI.getPurchase(p.id); setViewPurchase(r.data.data) }
    catch (e) { show(getErrMsg(e), 'danger') }
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
      await adminAPI.createPurchase({
        staff_id:    staffId    || undefined,
        supplier_id: supplierId || undefined,
        note:        note       || undefined,
        items: valid.map(it => ({ product_id: parseInt(it.product_id), quantity: parseInt(it.quantity), unit_price: parseFloat(it.unit_price) })),
      })
      show('Purchase recorded. Stock updated.', 'success')
      setCreateOpen(false); load()
    } catch (e) { setFormErr(getErrMsg(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await adminAPI.deletePurchase(delTarget.id); show('Purchase deleted. Stock reversed.', 'success'); setDelTarget(null); load() }
    catch (e) { show(getErrMsg(e), 'danger') }
    finally { setDeleting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">Purchases</h1><p className="page-subtitle">{pagination.total || 0} records</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Purchase</button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input type="date" className="form-input" style={{ width: 150 }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="form-input" style={{ width: 150 }} value={to}   onChange={e => setTo(e.target.value)} />
        {(from || to) && <button className="btn btn-ghost" onClick={() => { setFrom(''); setTo('') }}><X size={14} /> Clear</button>}
      </div>

      <div className="card">
        {loading ? <LoadingState /> : error ? <div className="card-body"><ErrorAlert message={error} /></div> : purchases.length === 0 ? (
          <EmptyState icon={<Truck size={40} />} title="No purchases yet" description="Record your first stock purchase." action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> New Purchase</button>} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Staff</th><th>Supplier</th><th>Total Cost</th><th>Date</th><th style={{ width: 100 }}>Actions</th></tr></thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{padId(p.id)}</span></td>
                    <td style={{ fontWeight: 500 }}>{p.staff_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.supplier_name || <span style={{ color: 'var(--text-muted)' }}>No supplier</span>}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(p.total_amount)}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDateTime(p.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openView(p)}><Eye size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setDelTarget(p)}><Trash2 size={13} /></button>
                      </div>
                    </td>
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
              style={{ background: n===page?'var(--brand)':'var(--surface)', color:n===page?'#fff':'var(--text-secondary)', border:'1px solid var(--border)', minWidth:32 }}>{n}</button>
          ))}
        </div>
      )}

      <Modal open={createOpen} title="New Purchase" onClose={() => setCreateOpen(false)} maxWidth={560}
        footer={<>
          <div style={{ flex: 1, fontWeight: 700, color: 'var(--warning)' }}>Total: {formatCurrency(total)}</div>
          <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Record purchase'}</button>
        </>}>
        <ErrorAlert message={formErr} />
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Staff member (optional)</label>
            <select className="form-select" value={staffId} onChange={e => setStaffId(e.target.value)}>
              <option value="">— Assign to myself —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Supplier (optional)</label>
            <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">No supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Note</label><input className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" /></div>
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

      <Modal open={!!viewPurchase} title={`Purchase ${padId(viewPurchase?.id)}`} onClose={() => setViewPurchase(null)} maxWidth={520}
        footer={<button className="btn btn-secondary" onClick={() => setViewPurchase(null)}>Close</button>}>
        {viewPurchase && (
          <>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Staff</span><div style={{ fontWeight: 500 }}>{viewPurchase.staff_name}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supplier</span><div>{viewPurchase.supplier_name || 'No supplier'}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date</span><div>{formatDateTime(viewPurchase.created_at)}</div></div>
              {viewPurchase.note && <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Note</span><div>{viewPurchase.note}</div></div>}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead><tr style={{ background: 'var(--surface-2)' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Subtotal</th>
                </tr></thead>
                <tbody>
                  {viewPurchase.items?.map(it => (
                    <tr key={it.id}><td style={{ padding: '6px 10px' }}>{it.product_name}</td><td style={{ padding: '6px 10px', textAlign: 'right' }}>{it.quantity}</td><td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(it.unit_price)}</td><td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(it.subtotal)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Total</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--warning)', fontSize: 15 }}>{formatCurrency(viewPurchase.total_amount)}</td>
                </tr></tfoot>
              </table>
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal open={!!delTarget} title="Delete purchase" message={`Delete purchase ${padId(delTarget?.id)}? Added stock will be removed.`} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} loading={deleting} />
    </div>
  )
}
