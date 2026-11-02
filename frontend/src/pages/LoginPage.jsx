import { useState } from 'react'
import useAuthStore from '../hooks/useAuth'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [empleado, setEmpleado] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, token } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(empleado, password)
    if (ok) navigate('/')
  }

  if (token) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="display text-5xl mb-1" style={{ color: 'var(--accent)' }}>
            TOOL<span style={{ color: 'var(--text)' }}>CRIP</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-2)' }}>Sistema de gestión de almacén</div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="empleado" className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Número de empleado</label>
            <input id="empleado" type="text" autoComplete="username" autoFocus className="input-field mono" placeholder="EMP-001"
              value={empleado} onChange={e => setEmpleado(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Contraseña</label>
            <input id="password" type="password" autoComplete="current-password" className="input-field"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && (
            <div role="alert" className="flex items-start gap-2 px-3 py-2.5 text-sm rounded-lg bg-red-500/10 border border-red-500/30" style={{ color: 'var(--red)' }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-accent w-full justify-center py-2.5 disabled:opacity-60">
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
