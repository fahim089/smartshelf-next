export const formatCurrency = (n) => `$${parseFloat(n || 0).toFixed(2)}`
export const formatDate     = (d) => d ? new Date(d).toLocaleDateString('en-AU') : '—'
export const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-AU', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
export const getErrMsg      = (e) => e?.response?.data?.message || e?.message || 'Something went wrong.'
export const padId          = (id) => `#${String(id).padStart(4,'0')}`

export function stockBadge(qty, threshold) {
  if (qty <= 0)          return { cls: 'badge-danger',  label: 'Out of Stock' }
  if (qty <= threshold)  return { cls: 'badge-warning', label: 'Low Stock'    }
  return                        { cls: 'badge-success', label: 'In Stock'     }
}

export function resolveImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const match = url.match(/([^/\\]+\.(jpg|jpeg|png|webp|gif))$/i)
  if (match) return `/uploads/${match[1]}`
  return url
}

export function getProductImage(product) {
  if (!product?.images?.length) return null
  return resolveImageUrl(product.images[0].image_url)
}
