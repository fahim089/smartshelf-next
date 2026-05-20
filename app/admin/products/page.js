'use client'
import { useState, useEffect, useCallback } from 'react'
import { Package, Plus, Search, Edit2, Trash2, RefreshCw, X, Image } from 'lucide-react'
import { adminAPI } from '@/lib/api'
import { resolveImageUrl } from '@/lib/utils'
import { formatCurrency, stockBadge, getErrMsg } from '@/lib/utils'
import { useToast } from '@/components/shared/Toast'
import { Modal, ConfirmModal, LoadingState, EmptyState, ErrorAlert } from '@/components/shared/ui'

const EMPTY = { name: '', description: '', category_id: '', sku: '', price: '', cost_price: '', unit: '', stock_quantity: '0', low_stock_threshold: '5' }

export default function AdminProducts() {
  const { show } = useToast()
  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  const [pagination,  setPagination]  = useState({})
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('')
  const [page,        setPage]        = useState(1)
  const [modal,       setModal]       = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [form,        setForm]        = useState(EMPTY)
  const [imgFiles,    setImgFiles]    = useState([])
  const [saving,      setSaving]      = useState(false)
  const [formErr,     setFormErr]     = useState('')
  const [delTarget,   setDelTarget]   = useState(null)
  const [deleting,    setDeleting]    = useState(false)
  const [imgModal,    setImgModal]    = useState(null)
  const [stockModal,  setStockModal]  = useState(null)
  const [stockQty,    setStockQty]    = useState('')
  const [stockOp,     setStockOp]     = useState('set')

  const load = useCallback(() => {
    setLoading(true); setError('')
    const params = { page, limit: 15 }
    if (search) params.search = search
    if (catFilter) params.category_id = catFilter
    adminAPI.getProducts(params)
      .then(r => { setProducts(r.data.data); setPagination(r.data.pagination) })
      .catch(e => setError(getErrMsg(e)))
      .finally(() => setLoading(false))
  }, [search, catFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { adminAPI.getCategories().then(r => setCategories(r.data.data)) }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setImgFiles([]); setFormErr(''); setModal(true) }
  const openEdit   = p => {
    setEditing(p)
    setForm({ name: p.name, description: p.description || '', category_id: p.category_id || '', sku: p.sku || '', price: p.price, cost_price: p.cost_price || '', unit: p.unit || '', stock_quantity: p.stock_quantity, low_stock_threshold: p.low_stock_threshold })
    setImgFiles([]); setFormErr(''); setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name || form.price === '') { setFormErr('Name and price are required.'); return }
    setSaving(true); setFormErr('')
    try {
      const payload = {
        ...form,
        price:               parseFloat(form.price),
        cost_price:          parseFloat(form.cost_price || 0),
        stock_quantity:      parseInt(form.stock_quantity || 0),
        low_stock_threshold: parseInt(form.low_stock_threshold || 5),
        category_id:         form.category_id || null,
      }
      let productId
      if (editing) {
        await adminAPI.updateProduct(editing.id, payload)
        productId = editing.id
        show('Product updated.', 'success')
      } else {
        const r = await adminAPI.createProduct(payload)
        productId = r.data.data.id
        show('Product created.', 'success')
      }
      if (imgFiles.length > 0) {
        const fd = new FormData()
        imgFiles.forEach(f => fd.append('images', f))
        await adminAPI.addImages(productId, fd)
      }
      closeModal(); load()
    } catch (e) { setFormErr(getErrMsg(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminAPI.deleteProduct(delTarget.id)
      show('Product deleted.', 'success')
      setDelTarget(null); load()
    } catch (e) { show(getErrMsg(e), 'danger') }
    finally { setDeleting(false) }
  }

  const handleStockUpdate = async () => {
    if (!stockQty) return
    try {
      // Build new stock value
      const current = stockModal.stock_quantity
      let newQty = parseFloat(stockQty)
      if (stockOp === 'add')      newQty = current + newQty
      if (stockOp === 'subtract') newQty = Math.max(0, current - newQty)
      // Use update product endpoint to change stock
      await adminAPI.updateProduct(stockModal.id, { stock_quantity: Math.round(newQty) })
      show('Stock updated.', 'success')
      setStockModal(null); load()
    } catch (e) { show(getErrMsg(e), 'danger') }
  }

  const handleDeleteImage = async (product, imgId) => {
    try {
      await adminAPI.deleteImage(product.id, imgId)
      show('Image deleted.', 'success')
      const r = await adminAPI.getProduct(product.id)
      setImgModal(r.data.data); load()
    } catch (e) { show(getErrMsg(e), 'danger') }
  }

  const handleAddImage = async (product, file) => {
    try {
      const fd = new FormData(); fd.append('images', file)
      await adminAPI.addImages(product.id, fd)
      show('Image added.', 'success')
      const r = await adminAPI.getProduct(product.id)
      setImgModal(r.data.data); load()
    } catch (e) { show(getErrMsg(e), 'danger') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{pagination.total || 0} items in catalogue</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Add Product</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div className="search-wrap" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={14} />
          <input className="form-input search-input" placeholder="Search products or SKU…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || catFilter) && <button className="btn btn-ghost" onClick={() => { setSearch(''); setCatFilter(''); setPage(1) }}><X size={14} /> Clear</button>}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <LoadingState /> : error ? <div className="card-body"><ErrorAlert message={error} /></div> : products.length === 0 ? (
          <EmptyState icon={<Package size={40} />} title="No products found" description="Add your first product to get started." action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Add Product</button>} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Cost</th><th>Stock</th><th>Status</th><th style={{ width: 150 }}>Actions</th></tr></thead>
              <tbody>
                {products.map(p => {
                  const s = stockBadge(p.stock_quantity, p.low_stock_threshold)
                  const img = p.images?.[0] ? resolveImageUrl(p.images[0].image_url) : null
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {img ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none' }} />
                                 : <Package size={14} color="var(--text-muted)" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                            {p.sku && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.sku}</div>}
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-neutral">{p.category_name || '—'}</span></td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.cost_price)}</td>
                      <td>
                        <button onClick={() => { setStockModal(p); setStockQty(''); setStockOp('set') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                          {p.stock_quantity}
                        </button>
                      </td>
                      <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit"><Edit2 size={13} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setStockModal(p); setStockQty(''); setStockOp('set') }} title="Update stock"><RefreshCw size={13} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setImgModal(p)} title="Images"><Image size={13} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setDelTarget(p)} title="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)} className="btn btn-sm"
              style={{ background: n === page ? 'var(--brand)' : 'var(--surface)', color: n === page ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)', minWidth: 32 }}>{n}</button>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal open={modal} title={editing ? 'Edit Product' : 'Add Product'} onClose={closeModal} maxWidth={520}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button></>}>
        <ErrorAlert message={formErr} />
        <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={f('name')} placeholder="Product name" /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={f('description')} placeholder="Optional description" style={{ minHeight: 56 }} /></div>
        <div className="form-group"><label className="form-label">Category</label>
          <select className="form-select" value={form.category_id} onChange={f('category_id')}>
            <option value="">No category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Selling price *</label><input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={f('price')} placeholder="0.00" /></div>
          <div className="form-group"><label className="form-label">Cost price</label><input className="form-input" type="number" min="0" step="0.01" value={form.cost_price} onChange={f('cost_price')} placeholder="0.00" /></div>
          <div className="form-group"><label className="form-label">SKU</label><input className="form-input" value={form.sku} onChange={f('sku')} placeholder="e.g. FP-001" /></div>
          <div className="form-group"><label className="form-label">Unit</label><input className="form-input" value={form.unit} onChange={f('unit')} placeholder="kg / each / bag" /></div>
          <div className="form-group"><label className="form-label">Stock quantity</label><input className="form-input" type="number" min="0" value={form.stock_quantity} onChange={f('stock_quantity')} /></div>
          <div className="form-group"><label className="form-label">Low stock threshold</label><input className="form-input" type="number" min="0" value={form.low_stock_threshold} onChange={f('low_stock_threshold')} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">Images (max 3 · JPEG/PNG/WebP)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => setImgFiles(Array.from(e.target.files).slice(0, 3))} style={{ fontSize: 13, color: 'var(--text-secondary)' }} />
          {imgFiles.length > 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{imgFiles.length} file(s) selected</p>}
        </div>
      </Modal>

      {/* Stock update modal */}
      <Modal open={!!stockModal} title={`Update Stock — ${stockModal?.name}`} onClose={() => setStockModal(null)} maxWidth={400}
        footer={<><button className="btn btn-secondary" onClick={() => setStockModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleStockUpdate}>Update stock</button></>}>
        <div style={{ padding: '4px 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>Current stock: <strong style={{ color: 'var(--text-primary)' }}>{stockModal?.stock_quantity}</strong></div>
        <div className="form-group"><label className="form-label">Operation</label>
          <select className="form-select" value={stockOp} onChange={e => setStockOp(e.target.value)}>
            <option value="set">Set to exact value</option>
            <option value="add">Add to current stock</option>
            <option value="subtract">Subtract from current stock</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" min="0" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="Enter quantity" /></div>
      </Modal>

      {/* Image management modal */}
      <Modal open={!!imgModal} title={`Images — ${imgModal?.name}`} onClose={() => setImgModal(null)} maxWidth={460}
        footer={<><div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>{imgModal?.images?.length || 0} / 3 images</div><button className="btn btn-secondary" onClick={() => setImgModal(null)}>Close</button></>}>
        {imgModal && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {imgModal.images?.map(img => {
                const url = resolveImageUrl(img.image_url)
                return (
                  <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                    {url
                      ? <img src={url} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} color="var(--text-muted)" /></div>
                    }
                    <button onClick={() => handleDeleteImage(imgModal, img.id)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(220,38,38,.9)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      ×
                    </button>
                  </div>
                )
              })}
              {(imgModal.images?.length || 0) < 3 && (
                <label style={{ aspectRatio: '1', borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                  <Plus size={18} /><span>Add</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleAddImage(imgModal, e.target.files[0])} />
                </label>
              )}
            </div>
            {!imgModal.images?.length && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No images yet.</p>}
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!delTarget} title="Delete product" message={`Delete "${delTarget?.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} loading={deleting} />
    </div>
  )
}
