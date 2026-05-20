'use client'
import { useState, useEffect, useCallback } from 'react'
import { Tag, Plus, Edit2, Trash2, Package } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import { getErrMsg } from '@/lib/utils'
import { useToast } from '@/components/shared/Toast'
import { Modal, ConfirmModal, LoadingState, EmptyState, ErrorAlert } from '@/components/shared/ui'

const emptyForm = { name: '' }

export default function AdminCategories() {
  const { show } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [modal, setModal]           = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [saving, setSaving]         = useState(false)
  const [formErr, setFormErr]       = useState('')
  const [delTarget, setDelTarget]   = useState(null)
  const [deleting, setDeleting]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { const r = await adminAPI.getCategories(); setCategories(r.data.data) }
    catch (e) { setError(getErrMsg(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErr(''); setModal(true) }
  const openEdit   = c  => { setEditing(c); setForm({ name: c.name }); setFormErr(''); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormErr('Category name is required.'); return }
    setSaving(true); setFormErr('')
    try {
      if (editing) await adminAPI.updateCategory(editing.id, form)
      else         await adminAPI.createCategory(form)
      show(editing ? 'Category updated.' : 'Category created.', 'success')
      closeModal(); load()
    } catch (e) { setFormErr(getErrMsg(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminAPI.deleteCategory(delTarget.id)
      show('Category deleted.', 'success')
      setDelTarget(null); load()
    } catch (e) { show(getErrMsg(e), 'danger') }
    finally { setDeleting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{categories.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Add Category</button>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorAlert message={error} /> : categories.length === 0 ? (
        <EmptyState icon={<Tag size={40} />} title="No categories" description="Create categories to organise your products." action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Add Category</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {categories.map(c => (
            <div key={c.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={16} color="var(--brand)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Package size={10} />{c.product_count || 0} products
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                  <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setDelTarget(c)}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} title={editing ? 'Edit Category' : 'Add Category'} onClose={closeModal} maxWidth={380}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add category'}</button></>}>
        <ErrorAlert message={formErr} />
        <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="e.g. Fresh Produce" autoFocus /></div>
      </Modal>

      <ConfirmModal open={!!delTarget} title="Delete category" message={`Delete "${delTarget?.name}"? Products in this category will become uncategorised.`} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} loading={deleting} />
    </div>
  )
}
