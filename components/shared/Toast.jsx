'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)

const ICONS   = { success:<CheckCircle size={16}/>, warning:<AlertTriangle size={16}/>, danger:<XCircle size={16}/>, info:<Info size={16}/> }
const COLORS  = {
  success: { bg:'var(--success-bg)', color:'var(--success)',  border:'#bbf7d0' },
  warning: { bg:'var(--warning-bg)', color:'var(--warning)',  border:'#fde68a' },
  danger:  { bg:'var(--danger-bg)',  color:'var(--danger)',   border:'#fecaca' },
  info:    { bg:'var(--info-bg)',    color:'var(--info)',     border:'#bae6fd' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10, maxWidth:360 }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info
          return (
            <div key={t.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:c.bg, color:c.color, border:`1px solid ${c.border}`, borderRadius:'var(--r-md)', boxShadow:'var(--shadow-md)', fontSize:13, fontWeight:500, animation:'slideUp .2s ease', minWidth:260 }}>
              <span style={{ flexShrink:0, marginTop:1 }}>{ICONS[t.type]}</span>
              <span style={{ flex:1, lineHeight:1.5 }}>{t.message}</span>
              <button onClick={() => remove(t.id)} style={{ background:'none', border:'none', cursor:'pointer', color:c.color, opacity:.7, padding:0, flexShrink:0 }}><X size={14}/></button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
