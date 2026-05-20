'use client'
import { useEffect, useState, useCallback } from 'react'
import { Package, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { staffAPI } from '@/lib/api'
import { resolveImageUrl } from '@/lib/utils'
import { formatCurrency, stockBadge } from '@/lib/utils'
import { LoadingState, EmptyState } from '@/components/shared/ui'

export default function StaffProducts() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({})
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [detail,     setDetail]     = useState(null)
  const [slideIdx,   setSlideIdx]   = useState(0)

  useEffect(() => { setSlideIdx(0) }, [detail])

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 16 }
    if (search) params.search = search
    if (catFilter) params.category_id = catFilter
    staffAPI.getProducts(params)
      .then(r => { setProducts(r.data.data); setPagination(r.data.pagination) })
      .finally(() => setLoading(false))
  }, [search, catFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { staffAPI.getCategories().then(r => setCategories(r.data.data)) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Products</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{pagination.total || 0} products</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={14} />
          <input className="form-input search-input" placeholder="Search products…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || catFilter) && <button className="btn btn-ghost" onClick={() => { setSearch(''); setCatFilter(''); setPage(1) }}><X size={14} /> Clear</button>}
      </div>

      {/* Cards */}
      {loading ? <LoadingState /> : products.length === 0 ? (
        <EmptyState icon={<Package size={40} />} title="No products found" description="No products match your search." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {products.map(p => {
            const s   = stockBadge(p.stock_quantity, p.low_stock_threshold)
            const img = p.images?.[0] ? resolveImageUrl(p.images[0].image_url) : null
            return (
              <div key={p.id} onClick={() => setDetail(p)}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                {/* Image */}
                <div style={{ height: 140, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {img
                    ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none' }} />
                    : <Package size={36} color="#cbd5e1" />
                  }
                </div>
                {/* Info */}
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{p.category_name || 'Uncategorised'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>
                      {formatCurrency(p.price)}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/{p.unit || 'ea'}</span>
                    </span>
                    <span className={`badge ${s.cls}`} style={{ fontSize: 10 }}>{p.stock_quantity}</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${s.cls}`} style={{ fontSize: 10 }}>{s.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)} className="btn btn-sm"
              style={{ background: n===page?'#16a34a':'#fff', color:n===page?'#fff':'#475569', border:'1px solid #e2e8f0', minWidth:32 }}>{n}</button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.1)' }}>
            {/* Image viewer */}
            {(() => {
              const imgs = detail.images || []
              const safeIdx = Math.min(slideIdx, Math.max(0, imgs.length - 1))
              const multi = imgs.length > 1
              return (
                <>
                  {/* Main image */}
                  <div style={{ height: 200, background: '#f8fafc', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imgs.length > 0
                      ? <img src={resolveImageUrl(imgs[safeIdx].image_url)} alt={detail.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                      : <Package size={48} color="#cbd5e1" />
                    }
                    {multi && (
                      <>
                        <button onClick={e => { e.stopPropagation(); setSlideIdx(i => (i - 1 + imgs.length) % imgs.length) }}
                          style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.4)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                          <ChevronLeft size={16} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setSlideIdx(i => (i + 1) % imgs.length) }}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.4)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                          <ChevronRight size={16} />
                        </button>
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.4)', color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 10 }}>
                          {safeIdx + 1}/{imgs.length}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Thumbnail strip — shows all images */}
                  {multi && (
                    <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: '#f1f5f9', overflowX: 'auto' }}>
                      {imgs.map((img, i) => (
                        <button key={i} onClick={e => { e.stopPropagation(); setSlideIdx(i) }}
                          style={{ width: 52, height: 52, flexShrink: 0, border: `2px solid ${i === safeIdx ? '#16a34a' : 'transparent'}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', padding: 0, background: '#e2e8f0' }}>
                          <img src={resolveImageUrl(img.image_url)} alt={`Image ${i + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{detail.name}</h2>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{detail.category_name || 'Uncategorised'} · {detail.sku || 'No SKU'}</p>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
              {detail.description && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>{detail.description}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Price</div>
                  <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 16 }}>{formatCurrency(detail.price)}/{detail.unit || 'ea'}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>In Stock</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{detail.stock_quantity} units</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
