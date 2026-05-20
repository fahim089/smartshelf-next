'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Package, Tag, Users, ShoppingCart,
  Truck, RotateCcw, UserCog, Settings, LogOut,
  ChevronLeft, ChevronRight, Store
} from 'lucide-react'
import { ToastProvider } from '@/components/shared/Toast'
import useAuthStore from '@/store/authStore'
import { authAPI } from '@/lib/api'

const NAV = [
  { href:'/admin/dashboard',  icon:LayoutDashboard, label:'Dashboard'  },
  { href:'/admin/products',   icon:Package,          label:'Products'   },
  { href:'/admin/categories', icon:Tag,              label:'Categories' },
  { href:'/admin/people',     icon:Users,            label:'People'     },
  { href:'/admin/sales',      icon:ShoppingCart,     label:'Sales'      },
  { href:'/admin/purchases',  icon:Truck,            label:'Purchases'  },
  { href:'/admin/returns',    icon:RotateCcw,        label:'Returns'    },
  { href:'/admin/users',      icon:UserCog,          label:'Users'      },
  { href:'/admin/profile',    icon:Settings,         label:'Profile'    },
]

export default function AdminLayout({ children }) {
  const router    = useRouter()
  const pathname  = usePathname()
  const { user, isAuthenticated, rehydrate, clearAuth } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.replace('/login'); return }
    if (!isAuthenticated) {
      import('@/lib/api').then(({ authAPI }) => {
        authAPI.me().then(r => {
          const u = r.data.data
          if (u.role !== 'admin') { router.replace('/staff/dashboard'); return }
          rehydrate(u); setReady(true)
        }).catch(() => { clearAuth(); router.replace('/login') })
      })
    } else {
      if (user?.role !== 'admin') { router.replace('/staff/dashboard'); return }
      setReady(true)
    }
  }, [])

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    clearAuth(); router.replace('/login')
  }

  if (!ready) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f8fafc' }}><div className="spinner"/></div>

  return (
    <ToastProvider>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
        {/* Sidebar */}
        <aside style={{ width:collapsed?64:220, flexShrink:0, display:'flex', flexDirection:'column', background:'var(--sidebar-bg)', borderRight:'1px solid var(--sidebar-border)', transition:'width .25s ease', overflow:'hidden' }}>
          {/* Logo */}
          <div style={{ height:60, display:'flex', alignItems:'center', padding:collapsed?'0 16px':'0 20px', borderBottom:'1px solid var(--sidebar-border)', gap:10, flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Store size={17} color="#fff"/>
            </div>
            {!collapsed && <span style={{ fontSize:16, fontWeight:800, color:'#fff', whiteSpace:'nowrap' }}>Smart<span style={{ color:'var(--brand)' }}>Shelf</span></span>}
          </div>



          {/* Nav */}
          <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
            {NAV.map(({ href, icon:Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href+'/')
              return (
                <Link key={href} href={href} title={collapsed?label:undefined}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:collapsed?'10px 16px':'9px 12px', borderRadius:9, marginBottom:2, color:active?'#fff':'var(--sidebar-text)', background:active?'var(--sidebar-active)':'transparent', textDecoration:'none', fontSize:13, fontWeight:active?600:400, whiteSpace:'nowrap', overflow:'hidden', transition:'all .15s', borderLeft:active?'3px solid var(--brand)':'3px solid transparent' }}>
                  <Icon size={16} style={{ flexShrink:0 }} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Bottom */}
          <div style={{ borderTop:'1px solid var(--sidebar-border)', padding:'8px' }}>
            <button onClick={()=>setCollapsed(!collapsed)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'8px 16px':'8px 12px', background:'none', border:'none', cursor:'pointer', color:'var(--sidebar-muted)', borderRadius:9, fontSize:13, fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {collapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}
              {!collapsed && <span>Collapse</span>}
            </button>
            <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'8px 16px':'8px 12px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', borderRadius:9, fontSize:13, fontFamily:'inherit', whiteSpace:'nowrap' }}>
              <LogOut size={16}/>
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          {/* Top bar */}
          <header style={{ height:60, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', background:'var(--surface)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100, boxShadow:'var(--shadow-sm)' }}>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>Admin Panel</span>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'var(--brand)' }}>Administrator</div>
              </div>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--brand)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </header>
          <main style={{ flex:1, overflowY:'auto', padding:24 }}>{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
