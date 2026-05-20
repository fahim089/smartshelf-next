'use client'
import { useState, useEffect } from 'react'
import { UserCog, Plus, Edit2, Trash2, Shield } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import { getErrMsg } from '@/lib/utils'
import { useToast } from '@/components/shared/Toast'
import { Modal, ConfirmModal, LoadingState, EmptyState, ErrorAlert } from '@/components/shared/ui'

const EMPTY = { name: '', email: '', phone: '', password: '', role: 'staff' }

export default function AdminUsers() {
  const { show } = useToast()
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState('')
  const [delTarget, setDelTarget] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const load = () => {
    setLoading(true)
    adminAPI.getUsers().then(r => setUsers(r.data.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const open  = (u = null) => { setEditing(u); setForm(u ? { ...u, password: '' } : EMPTY); setFormErr(''); setModal(true) }
  const close = () => { setModal(false); setEditing(null) }
  const f     = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name || !form.email) { setFormErr('Name and email are required.'); return }
    if (!editing && !form.password) { setFormErr('Password is required for new users.'); return }
    setSaving(true); setFormErr('')
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role }
      if (form.password) payload.password = form.password
      if (editing) { await adminAPI.updateUser(editing.id, payload); show('User updated.', 'success') }
      else          { await adminAPI.createUser({ ...payload, password: form.password }); show('User created.', 'success') }
      close(); load()
    } catch (e) { setFormErr(getErrMsg(e)) }
    finally { setSaving(false) }
  }

  const handleToggle = async u => {
    try {
      await adminAPI.updateUser(u.id, { is_active: !u.is_active })
      show(u.is_active ? 'User disabled.' : 'User enabled.', 'success')
      load()
    } catch (e) { show(getErrMsg(e), 'danger') }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await adminAPI.deleteUser(delTarget.id); show('User deleted.', 'success'); setDelTarget(null); load() }
    catch (e) { show(getErrMsg(e), 'danger') }
    finally { setDeleting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">Manage staff accounts</p></div>
        <button className="btn btn-primary" onClick={() => open()}><Plus size={15} /> Add User</button>
      </div>

      <div className="card">
        {loading ? <LoadingState /> : users.length === 0 ? (
          <EmptyState icon={<UserCog size={40} />} title="No users yet" description="Create staff accounts." action={<button className="btn btn-primary" onClick={() => open()}><Plus size={14} /> Add User</button>} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th style={{ width: 180 }}>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-light)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          {u.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-brand' : 'badge-neutral'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                        <Shield size={10} />{u.role}
                      </span>
                    </td>
                    <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => open(u)} title="Edit"><Edit2 size={13} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(u)} style={{ fontSize: 12, color: u.is_active ? 'var(--warning)' : 'var(--success)' }}>
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setDelTarget(u)} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} title={editing ? 'Edit User' : 'Add User'} onClose={close} maxWidth={420}
        footer={<><button className="btn btn-secondary" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add user'}</button></>}>
        <ErrorAlert message={formErr} />
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={f('name')} placeholder="John Smith" autoFocus /></div>
          <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={f('email')} placeholder="john@example.com" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={f('phone')} placeholder="04xx xxx xxx" /></div>
          <div className="form-group"><label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={f('role')}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
          <input className="form-input" type="password" value={form.password} onChange={f('password')} placeholder={editing ? 'Leave blank to keep current' : 'Min 8 characters'} />
        </div>
      </Modal>

      <ConfirmModal open={!!delTarget} title="Delete user" message={`Delete "${delTarget?.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} loading={deleting} />
    </div>
  )
}
