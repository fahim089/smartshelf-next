'use client'
import { useState, useEffect, useCallback } from 'react'
import { Users, Building2, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, X } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import { getErrMsg } from '@/lib/utils'
import { useToast } from '@/components/shared/Toast'
import { Modal, ConfirmModal, LoadingState, EmptyState, ErrorAlert } from '@/components/shared/ui'

const emptyForm = { type: 'customer', name: '', email: '', phone: '', address: '', note: '' }

export default function AdminPeople() {
  const { show } = useToast()
  const [tab, setTab]             = useState('customers')
  const isSupplier                = tab === 'suppliers'
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState('')
  const [delTarget, setDelTarget] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { type: isSupplier ? 'supplier' : 'customer' }
      if (search) params.search = search
      const r = await adminAPI.getPeople(params)
      setItems(r.data.data)
    } catch (e) { setError(getErrMsg(e)) }
    finally { setLoading(false) }
  }, [tab, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSearch('') }, [tab])

  const label = isSupplier ? 'Supplier' : 'Customer'

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, type: isSupplier ? 'supplier' : 'customer' })
    setFormErr(''); setModal(true)
  }
  const openEdit   = item => {
    setEditing(item)
    setForm({ type: item.type, name: item.name, email: item.email || '', phone: item.phone || '', address: item.address || '', note: item.note || '' })
    setFormErr(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) { setFormErr('Name is required.'); return }
    setSaving(true); setFormErr('')
    try {
      if (editing) await adminAPI.updatePerson(editing.id, form)
      else         await adminAPI.createPerson(form)
      show(`${label} ${editing ? 'updated' : 'created'}.`, 'success')
      closeModal(); load()
    } catch (e) { setFormErr(getErrMsg(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminAPI.deletePerson(delTarget.id)
      show(`${label} deleted.`, 'success')
      setDelTarget(null); load()
    } catch (e) { show(getErrMsg(e), 'danger') }
    finally { setDeleting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">People</h1><p className="page-subtitle">Customers and suppliers</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Add {label}</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {[['customers', Users, 'Customers'], ['suppliers', Building2, 'Suppliers']].map(([key, Icon, lbl]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', border: 'none', cursor: 'pointer',
            background: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            color: tab === key ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: tab === key ? '2px solid var(--brand)' : '2px solid transparent',
            marginBottom: -1, transition: 'all .15s',
          }}>
            <Icon size={14} />{lbl}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-wrap" style={{ maxWidth: 320 }}>
        <Search size={14} />
        <input className="form-input search-input" placeholder={`Search ${isSupplier ? 'suppliers' : 'customers'}…`} value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><X size={13} /></button>}
      </div>

      {loading ? <LoadingState /> : error ? <ErrorAlert message={error} /> : items.length === 0 ? (
        <EmptyState
          icon={isSupplier ? <Building2 size={40} /> : <Users size={40} />}
          title={`No ${isSupplier ? 'suppliers' : 'customers'} yet`}
          description={`Add your first ${label.toLowerCase()}.`}
          action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Add {label}</button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: isSupplier ? 'var(--info-bg)' : 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: isSupplier ? 'var(--info)' : 'var(--brand)', flexShrink: 0 }}>
                    {item.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(item)}><Edit2 size={13} /></button>
                  <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setDelTarget(item)}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {item.email   && <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={11} />{item.email}</div>}
                {item.phone   && <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={11} />{item.phone}</div>}
                {item.address && <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={11} />{item.address}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} title={editing ? `Edit ${label}` : `Add ${label}`} onClose={closeModal} maxWidth={440}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : `Add ${label}`}</button></>}>
        <ErrorAlert message={formErr} />
        <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={f('name')} placeholder={isSupplier ? 'Company name' : 'Full name'} autoFocus /></div>
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="email@example.com" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={f('phone')} placeholder="04xx xxx xxx" /></div>
        </div>
        <div className="form-group"><label className="form-label">Address</label><textarea className="form-textarea" value={form.address} onChange={f('address')} placeholder="Street, Suburb, State" style={{ minHeight: 60 }} /></div>
        <div className="form-group"><label className="form-label">Note</label><textarea className="form-textarea" value={form.note} onChange={f('note')} placeholder="Optional note" style={{ minHeight: 50 }} /></div>
      </Modal>

      <ConfirmModal open={!!delTarget} title={`Delete ${label}`} message={`Delete "${delTarget?.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} loading={deleting} />
    </div>
  )
}
