import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('tc_token'),
  loading: false,
  error: null,

  login: async (empleado, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { empleado, password })
      localStorage.setItem('tc_token', data.token)
      set({ user: data.user, token: data.token, loading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Error al iniciar sesión', loading: false })
      return false
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user })
    } catch {
      set({ user: null, token: null })
      localStorage.removeItem('tc_token')
    }
  },

  logout: () => {
    localStorage.removeItem('tc_token')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
