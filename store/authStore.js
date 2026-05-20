'use client'
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user:            null,
  isAuthenticated: false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token',  accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    set({ user, isAuthenticated: true })
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  rehydrate: (user) => set({ user, isAuthenticated: true }),
}))

export default useAuthStore
