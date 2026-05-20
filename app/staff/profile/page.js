'use client'
import { useState } from 'react'
import { User, KeyRound, Eye, EyeOff, Save, CheckCircle, Shield } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'
import { getErrMsg } from '@/lib/utils'
import { ErrorAlert } from '@/components/shared/ui'
import useAuthStore from '@/store/authStore'

function PwInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input className="form-input" type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder || '••••••••'} style={{ paddingRight: 38 }} />
        <button type="button" onClick={() => setShow(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

export default function StaffProfile() {
  const { show } = useToast()
  const { user, setUser } = useAuthStore()
  const [name,  setName]  = useState(user?.name  || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [profileErr, setProfileErr] = useState('')

  const [pw, setPw]         = useState({ current: '', newpw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved]   = useState(false)
  const [pwErr, setPwErr]       = useState('')

  const isDirty = name !== user?.name || email !== user?.email || phone !== (user?.phone || '')

  const handleProfile = async () => {
    if (!name.trim()) { setProfileErr('Name is required.'); return }
    setSaving(true); setProfileErr('')
    try {
      const { data } = await authAPI.updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() })
      setUser(data.data)
      show('Profile updated.', 'success')
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) { setProfileErr(getErrMsg(e)) }
    finally { setSaving(false) }
  }

  const handlePassword = async () => {
    if (!pw.current || !pw.newpw || !pw.confirm) { setPwErr('All three fields are required.'); return }
    if (pw.newpw.length < 8) { setPwErr('New password must be at least 8 characters.'); return }
    if (pw.newpw !== pw.confirm) { setPwErr('New passwords do not match.'); return }
    setPwSaving(true); setPwErr('')
    try {
      await authAPI.changePassword({ current_password: pw.current, new_password: pw.newpw })
      show('Password changed.', 'success')
      setPw({ current: '', newpw: '', confirm: '' })
      setPwSaved(true); setTimeout(() => setPwSaved(false), 3000)
    } catch (e) { setPwErr(getErrMsg(e)) }
    finally { setPwSaving(false) }
  }

  const pf = k => e => { setPw(p => ({ ...p, [k]: e.target.value })); setPwErr(''); setPwSaved(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>

      {/* Avatar card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <Shield size={12} color="#16a34a" />
            <span style={{ fontSize: 12, color: '#64748b' }}>Staff Member</span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>My profile</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Update your name, email and phone</div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <ErrorAlert message={profileErr} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 560 }}>
            <div className="form-group"><label className="form-label">Full name</label><input className="form-input" value={name} onChange={e => { setName(e.target.value); setSaved(false) }} /></div>
            <div className="form-group"><label className="form-label">Email address</label><input className="form-input" type="email" value={email} onChange={e => { setEmail(e.target.value); setSaved(false) }} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={phone} onChange={e => { setPhone(e.target.value); setSaved(false) }} placeholder="04xx xxx xxx" /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={handleProfile} disabled={saving || !isDirty}>
              {saving ? 'Saving…' : <><Save size={14} /> Save profile</>}
            </button>
            {saved && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#16a34a' }}><CheckCircle size={14} /> Saved</div>}
            {isDirty && !saved && (
              <button className="btn btn-ghost" onClick={() => { setName(user?.name); setEmail(user?.email); setPhone(user?.phone || ''); setProfileErr('') }}>Cancel</button>
            )}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={16} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Change password</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Minimum 8 characters</div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <ErrorAlert message={pwErr} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
            <PwInput label="Current password" value={pw.current} onChange={pf('current')} />
            <div style={{ height: 1, background: '#e2e8f0' }} />
            <PwInput label="New password" value={pw.newpw} onChange={pf('newpw')} placeholder="Min 8 characters" />
            <PwInput label="Confirm new password" value={pw.confirm} onChange={pf('confirm')} />
            {pw.confirm && pw.newpw && pw.confirm !== pw.newpw && (
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: -8 }}>Passwords do not match</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={handlePassword} disabled={pwSaving || !pw.current}>
              {pwSaving ? 'Updating…' : <><KeyRound size={14} /> Update password</>}
            </button>
            {pwSaved && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#16a34a' }}><CheckCircle size={14} /> Updated</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
