import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('tc_token'),
  loading: false,
  error: null,
  sessionError: false,

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
    set({ sessionError: false })
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user })
    } catch (err) {
      // Solo un 401 cierra la sesión: una falla de red o del servidor se puede reintentar
      if (err.response?.status === 401) {
        set({ user: null, token: null })
        localStorage.removeItem('tc_token')
      } else {
        set({ sessionError: true })
      }
    }
  },

  logout: () => {
    localStorage.removeItem('tc_token')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
