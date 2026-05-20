'use client'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const rt = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
      if (!rt) {
        if (typeof window !== 'undefined') { localStorage.clear(); window.location.href = '/login' }
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post('/api/auth/refresh', { refresh_token: rt })
        localStorage.setItem('access_token',  data.data.access_token)
        localStorage.setItem('refresh_token', data.data.refresh_token)
        original.headers.Authorization = `Bearer ${data.data.access_token}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  login:          (b) => api.post('/auth/login', b),
  register:       (b) => api.post('/auth/register', b),
  logout:         ()  => api.post('/auth/logout'),
  me:             ()  => api.get('/auth/me'),
  updateProfile:  (b) => api.put('/auth/profile', b),
  changePassword: (b) => api.post('/auth/change-password', b),
}

export const adminAPI = {
  dashboard:      ()         => api.get('/admin/dashboard'),
  getUsers:       ()         => api.get('/admin/users'),
  createUser:     (b)        => api.post('/admin/users', b),
  updateUser:     (id, b)    => api.put(`/admin/users/${id}`, b),
  deleteUser:     (id)       => api.delete(`/admin/users/${id}`),
  getCategories:  ()         => api.get('/admin/categories'),
  createCategory: (b)        => api.post('/admin/categories', b),
  updateCategory: (id, b)    => api.put(`/admin/categories/${id}`, b),
  deleteCategory: (id)       => api.delete(`/admin/categories/${id}`),
  getProducts:    (p)        => api.get('/admin/products', { params: p }),
  getProduct:     (id)       => api.get(`/admin/products/${id}`),
  createProduct:  (b)        => api.post('/admin/products', b),
  updateProduct:  (id, b)    => api.put(`/admin/products/${id}`, b),
  deleteProduct:  (id)       => api.delete(`/admin/products/${id}`),
  addImages:      (id, form) => api.post(`/admin/products/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage:    (id, imgId)=> api.delete(`/admin/products/${id}/images/${imgId}`),
  getPeople:      (p)        => api.get('/admin/people', { params: p }),
  createPerson:   (b)        => api.post('/admin/people', b),
  updatePerson:   (id, b)    => api.put(`/admin/people/${id}`, b),
  deletePerson:   (id)       => api.delete(`/admin/people/${id}`),
  getSales:       (p)        => api.get('/admin/sales',     { params: p }),
  getSale:        (id)       => api.get(`/admin/sales/${id}`),
  createSale:     (b)        => api.post('/admin/sales', b),
  deleteSale:     (id)       => api.delete(`/admin/sales/${id}`),
  getPurchases:   (p)        => api.get('/admin/purchases', { params: p }),
  getPurchase:    (id)       => api.get(`/admin/purchases/${id}`),
  createPurchase: (b)        => api.post('/admin/purchases', b),
  deletePurchase: (id)       => api.delete(`/admin/purchases/${id}`),
  getReturns:     (p)        => api.get('/admin/returns',   { params: p }),
  getReturn:      (id)       => api.get(`/admin/returns/${id}`),
  updateReturn:   (id, st)   => api.patch(`/admin/returns/${id}/status`, { status: st }),
  deleteReturn:   (id)       => api.delete(`/admin/returns/${id}`),
}

export const staffAPI = {
  dashboard:      ()    => api.get('/staff/dashboard'),
  getProducts:    (p)   => api.get('/staff/products',  { params: p }),
  getProduct:     (id)  => api.get(`/staff/products/${id}`),
  getCategories:  ()    => api.get('/staff/categories'),
  getSales:       (p)   => api.get('/staff/sales',     { params: p }),
  getSale:        (id)  => api.get(`/staff/sales/${id}`),
  createSale:     (b)   => api.post('/staff/sales', b),
  getPurchases:   (p)   => api.get('/staff/purchases', { params: p }),
  getPurchase:    (id)  => api.get(`/staff/purchases/${id}`),
  createPurchase: (b)   => api.post('/staff/purchases', b),
  getReturns:     (p)   => api.get('/staff/returns',   { params: p }),
  getReturn:      (id)  => api.get(`/staff/returns/${id}`),
  createReturn:   (b)   => api.post('/staff/returns', b),
}
