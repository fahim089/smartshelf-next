'use client'
import { X, AlertTriangle, Trash2 } from 'lucide-react'

export function Modal({ open, title, children, footer, onClose, maxWidth = 480 }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel, loading, danger = true }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ color: danger ? 'var(--danger)' : undefined }}>{title}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCancel}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn" onClick={onConfirm} disabled={loading}
            style={danger ? { background:'var(--danger)', color:'#fff' } : { background:'var(--brand)', color:'#fff' }}>
            {loading ? 'Please wait…' : <><Trash2 size={13} /> Confirm</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export function LoadingState({ text = 'Loading…' }) {
  return <div className="loading-wrap"><div className="spinner" /><span style={{ fontSize: 13 }}>{text}</span></div>
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  )
}

export function ErrorAlert({ message }) {
  if (!message) return null
  return <div className="alert alert-danger"><AlertTriangle size={14} />{message}</div>
}
