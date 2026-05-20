'use client'
import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Plus, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import { formatCurrency, formatDateTime, getErrMsg, padId } from '@/lib/utils'
import { useToast } from '@/components/shared/Toast'
import { Modal, ConfirmModal, LoadingState, EmptyState, ErrorAlert } from '@/components/shared/ui'

const STATUS_BADGE = {
  pending:  'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
}

export default function AdminReturns() {
  const { show } = useToast()
  const [returns, setReturns]       = useState([])
  const [pagination, setPagination] = useState({})
  const [page, setPage]             = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [viewReturn, setViewReturn] = useState(null)
  const [delTarget, setDelTarget]   = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [updating, setUpdating]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      const r = await adminAPI.getReturns(params)
      setReturns(r.data.data); setPagination(r.data.pagination)
    } catch (e) { setError(getErrMsg(e)) }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const openView = async r => {
    try { const res = await adminAPI.getReturn(r.id); setViewReturn(res.data.data) }
    catch (e) { show(getErrMsg(e), 'danger') }
  }

  const handleStatus = async (id, status) => {
    setUpdating(id)
    try {
      await adminAPI.updateReturn(id, status)
      show(`Return ${status}.`, status === 'approved' ? 'success' : 'info')
      load()
      if (viewReturn?.id === id) {
        const r = await adminAPI.getReturn(id)
        setViewReturn(r.data.data)
      }
    } catch (e) { show(getErrMsg(e), 'danger') }
    finally { setUpdating(null) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await adminAPI.deleteReturn(delTarget.id); show('Return deleted.', 'success'); setDelTarget(null); load() }
    catch (e) { show(getErrMsg(e), 'danger') }
    finally { setDeleting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h1 className="page-title">Returns</h1><p className="page-subtitle">{pagination.total || 0} records</p></div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([val, lbl]) => (
          <button key={val} onClick={() => { setStatusFilter(val); setPage(1) }} style={{
            padding: '10px 18px', border: 'none', cursor: 'pointer', background: 'none',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            color: statusFilter === val ? 'var(--brand)' : 'var(--text-secondary)',
            borderBottom: statusFilter === val ? '2px solid var(--brand)' : '2px solid transparent',
            marginBottom: -1, transition: 'all .15s',
          }}>{lbl}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <LoadingState /> : error ? <div className="card-body"><ErrorAlert message={error} /></div> : returns.length === 0 ? (
          <EmptyState icon={<RotateCcw size={40} />} title="No returns found" description="Returns submitted by staff will appear here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Staff</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th><th style={{ width: 160 }}>Actions</th></tr></thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{padId(r.id)}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.staff_name}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(r.total_amount)}</span></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{r.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDateTime(r.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openView(r)}><Eye size={13} /></button>
                        {r.status === 'pending' && (
                          <>
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--success)' }} onClick={() => handleStatus(r.id, 'approved')} disabled={updating === r.id} title="Approve">
                              <CheckCircle size={13} />
                            </button>
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleStatus(r.id, 'rejected')} disabled={updating === r.id} title="Reject">
                              <XCircle size={13} />
                            </button>
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setDelTarget(r)}><Trash2 size={13} /></button>
                          </>
                        )}
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

      {/* View modal */}
      <Modal open={!!viewReturn} title={`Return ${padId(viewReturn?.id)}`} onClose={() => setViewReturn(null)} maxWidth={520}
        footer={<>
          {viewReturn?.status === 'pending' && (
            <>
              <button className="btn" style={{ background: 'var(--success-bg)', color: 'var(--success)' }} onClick={() => handleStatus(viewReturn.id, 'approved')}>✓ Approve</button>
              <button className="btn" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => handleStatus(viewReturn.id, 'rejected')}>✗ Reject</button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => setViewReturn(null)}>Close</button>
        </>}>
        {viewReturn && (
          <>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Staff</span><div style={{ fontWeight: 500 }}>{viewReturn.staff_name}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status</span><div><span className={`badge ${STATUS_BADGE[viewReturn.status]}`} style={{ textTransform: 'capitalize' }}>{viewReturn.status}</span></div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date</span><div>{formatDateTime(viewReturn.created_at)}</div></div>
              {viewReturn.reason && <div><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reason</span><div>{viewReturn.reason}</div></div>}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead><tr style={{ background: 'var(--surface-2)' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Refund</th>
                </tr></thead>
                <tbody>
                  {viewReturn.items?.map(it => (
                    <tr key={it.id}><td style={{ padding: '6px 10px' }}>{it.product_name}</td><td style={{ padding: '6px 10px', textAlign: 'right' }}>{it.quantity}</td><td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(it.subtotal)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Total refund</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--danger)', fontSize: 15 }}>{formatCurrency(viewReturn.total_amount)}</td>
                </tr></tfoot>
              </table>
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal open={!!delTarget} title="Delete return" message={`Delete return ${padId(delTarget?.id)}?`} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} loading={deleting} />
    </div>
  )
}
