'use client'
import { useState } from 'react'
import { User, KeyRound, Eye, EyeOff, Save, CheckCircle, Shield } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'
import { getErrMsg } from '@/lib/utils'
import { ErrorAlert } from '@/components/shared/ui'
import useAuthStore from '@/store/authStore'

function Section({ icon: Icon, iconBg, iconColor, title, subtitle, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} color={iconColor} />
          </div>
          <div>
            <div className="card-title">{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{subtitle}</div>
          </div>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}

function PwInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input className="form-input" type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder || '••••••••'} style={{ paddingRight: 38 }} />
        <button type="button" onClick={() => setShow(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

function StrengthBar({ password }) {
  if (!password) return null
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length
  const colors = ['', 'var(--danger)', 'var(--warning)', '#0284c7', 'var(--success)']
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  return (
    <div style={{ marginTop: -6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : 'var(--border)', transition: 'background .3s' }} />)}
      </div>
      <div style={{ fontSize: 11, color: colors[score] }}>{labels[score]}</div>
    </div>
  )
}

export default function AdminProfile() {
  const { show } = useToast()
  const { user, setUser } = useAuthStore()
  const [name, setName]   = useState(user?.name  || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [profileErr, setProfileErr] = useState('')

  const [pw, setPw] = useState({ current: '', newpw: '', confirm: '' })
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
      show('Password changed successfully.', 'success')
      setPw({ current: '', newpw: '', confirm: '' })
      setPwSaved(true); setTimeout(() => setPwSaved(false), 3000)
    } catch (e) { setPwErr(getErrMsg(e)) }
    finally { setPwSaving(false) }
  }

  const pf = k => e => { setPw(p => ({ ...p, [k]: e.target.value })); setPwErr(''); setPwSaved(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

      {/* Profile section */}
      <Section icon={User} iconBg="var(--brand-light)" iconColor="var(--brand)" title="My profile" subtitle="Update your display name, email and phone">

        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <Shield size={12} color="var(--brand)" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Administrator account</span>
            </div>
          </div>
        </div>

        <ErrorAlert message={profileErr} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 560 }}>
          <div className="form-group"><label className="form-label">Full name</label><input className="form-input" value={name} onChange={e => { setName(e.target.value); setSaved(false) }} placeholder="Your full name" /></div>
          <div className="form-group"><label className="form-label">Email address</label><input className="form-input" type="email" value={email} onChange={e => { setEmail(e.target.value); setSaved(false) }} placeholder="your@email.com" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={phone} onChange={e => { setPhone(e.target.value); setSaved(false) }} placeholder="04xx xxx xxx" /></div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-primary" onClick={handleProfile} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : <><Save size={14} /> Save profile</>}
          </button>
          {saved && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--success)' }}><CheckCircle size={14} /> Saved</div>}
          {isDirty && !saved && (
            <button className="btn btn-ghost" onClick={() => { setName(user?.name); setEmail(user?.email); setPhone(user?.phone || ''); setProfileErr('') }}>Cancel</button>
          )}
        </div>
      </Section>

      {/* Password section */}
      <Section icon={KeyRound} iconBg="var(--info-bg)" iconColor="var(--info)" title="Change password" subtitle="Choose a strong password — minimum 8 characters">
        <ErrorAlert message={pwErr} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
          <PwInput label="Current password" value={pw.current} onChange={pf('current')} />
          <div style={{ height: 1, background: 'var(--border)' }} />
          <PwInput label="New password" value={pw.newpw} onChange={pf('newpw')} />
          <StrengthBar password={pw.newpw} />
          <PwInput label="Confirm new password" value={pw.confirm} onChange={pf('confirm')} />
          {pw.confirm && pw.newpw && pw.confirm !== pw.newpw && (
            <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -8 }}>Passwords do not match</div>
          )}
          {pw.confirm && pw.newpw && pw.confirm === pw.newpw && pw.newpw.length >= 8 && (
            <div style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, marginTop: -8 }}><CheckCircle size={12} /> Passwords match</div>
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-primary" onClick={handlePassword} disabled={pwSaving || !pw.current}>
            {pwSaving ? 'Updating…' : <><KeyRound size={14} /> Update password</>}
          </button>
          {pwSaved && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--success)' }}><CheckCircle size={14} /> Password updated</div>}
        </div>
      </Section>
    </div>
  )
}
