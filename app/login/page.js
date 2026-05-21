'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '@/lib/api'
import useAuthStore from '@/store/authStore'

const inp = { width:'100%', height:46, padding:'0 14px', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', background:'#fff', transition:'all .2s', fontFamily:'inherit', color:'#0f172a' }
const btnSt = { width:'100%', height:46, border:'none', borderRadius:10, background:'#2563eb', color:'#fff', fontWeight:600, fontSize:14, cursor:'pointer', marginTop:8, transition:'all .2s', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }

const focus = e => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,.1)' }
const blur  = e => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none' }

export default function LoginPage() {
  const router = useRouter()
  const { user, isAuthenticated, setAuth } = useAuthStore()
  const [tab,      setTab]      = useState('login')
  const [login,    setLogin]    = useState('')
  const [reg,      setReg]      = useState({ name:'', email:'', password:'', confirm:'' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard')
    }
  }, [isAuthenticated, user])

  const handleLogin = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await authAPI.login(login)
      setAuth(data.data.user, data.data.access_token, data.data.refresh_token)
    } catch (err) { setError(err.response?.data?.message || 'Invalid email or password.') }
    finally { setLoading(false) }
  }

  const handleRegister = async e => {
    e.preventDefault(); setError('')
    if (!reg.name||!reg.email||!reg.password) { setError('All fields are required.'); return }
    if (reg.password !== reg.confirm) { setError('Passwords do not match.'); return }
    if (reg.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await authAPI.register({ name:reg.name, email:reg.email, password:reg.password })
      setTab('login'); setLogin(p=>({...p, email:reg.email})); setReg({ name:'', email:'', password:'', confirm:'' }); setError('')
      alert('Registration successful! Please sign in.')
    } catch (err) { setError(err.response?.data?.message || 'Registration failed.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#f8fafc', overflow:'hidden' }}>
      {/* Left — form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ width:'100%', maxWidth:480, background:'#fff', borderRadius:20, padding:32, border:'1px solid #e2e8f0', boxShadow:'0 4px 20px rgba(0,0,0,.05)' }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Store size={24} color="#fff" />
            </div>
            <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'#0f172a' }}>Smart<span style={{ color:'#2563eb' }}>Shelf</span></h1>
            <p style={{ marginTop:6, color:'#64748b', fontSize:14 }}>Inventory Management System</p>
          </div>
          {/* Tabs */}
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:12, padding:4, marginBottom:20 }}>
            {[['login','Sign In'],['register','Sign Up']].map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setError('')}}
                style={{ flex:1, height:42, border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:14, fontFamily:'inherit', transition:'all .2s', background:tab===t?'#2563eb':'transparent', color:tab===t?'#fff':'#64748b' }}>{l}</button>
            ))}
          </div>
          {error && <div style={{ marginBottom:14, padding:12, borderRadius:10, background:'#fee2e2', color:'#dc2626', fontSize:14 }}>{error}</div>}

          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', marginBottom:6, fontSize:14, fontWeight:600, color:'#0f172a' }}>Email</label>
                <input type="email" required value={login.email} onChange={e=>setLogin({...login,email:e.target.value})} placeholder="Enter your email" style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={{ display:'block', marginBottom:6, fontSize:14, fontWeight:600, color:'#0f172a' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPass?'text':'password'} required value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} placeholder="••••••••" style={{...inp,paddingRight:44}} onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748b' }}>
                    {showPass?<EyeOff size={18}/>:<Eye size={18}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnSt}>{loading?'Signing in…':'Sign In'}</button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:13, fontWeight:600, color:'#0f172a' }}>Full Name</label>
                  <input type="text" required value={reg.name} onChange={e=>setReg({...reg,name:e.target.value})} placeholder="John Smith" style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:13, fontWeight:600, color:'#0f172a' }}>Email</label>
                  <input type="email" required value={reg.email} onChange={e=>setReg({...reg,email:e.target.value})} placeholder="you@example.com" style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ position:'relative' }}>
                  <label style={{ display:'block', marginBottom:5, fontSize:13, fontWeight:600, color:'#0f172a' }}>Password</label>
                  <input type={showPass?'text':'password'} required value={reg.password} onChange={e=>setReg({...reg,password:e.target.value})} placeholder="Min 8 chars" style={{...inp,paddingRight:44}} onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:12, bottom:9, background:'none', border:'none', cursor:'pointer', color:'#64748b' }}>{showPass?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                </div>
                <div style={{ position:'relative' }}>
                  <label style={{ display:'block', marginBottom:5, fontSize:13, fontWeight:600, color:'#0f172a' }}>Confirm</label>
                  <input type={showConf?'text':'password'} required value={reg.confirm} onChange={e=>setReg({...reg,confirm:e.target.value})} placeholder="Re-enter" style={{...inp,paddingRight:44}} onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={()=>setShowConf(!showConf)} style={{ position:'absolute', right:12, bottom:9, background:'none', border:'none', cursor:'pointer', color:'#64748b' }}>{showConf?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnSt}>{loading?'Creating…':'Create Staff Account'}</button>
            </form>
          )}
        </div>
      </div>

      {/* Right — image panel */}
      <div className="login-right" style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 30,
        background: 'linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)'
      }}>
        <img 
          src="/login.png" 
          alt="SmartShelf Inventory Management" 
          style={{
            width: '100%',
            maxWidth: 550,
            height: 'auto',
            objectFit: 'contain',
            animation: 'float 5s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @media(max-width:900px){
          .login-right{
            display:none!important;
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  )
}