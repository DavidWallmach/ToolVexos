import { useState } from 'react'
import useAuthStore from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [empleado, setEmpleado] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(empleado, password)
    if (ok) navigate('/app')
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#0a0a0a'}}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="display text-5xl mb-1" style={{color:'#f5a623'}}>
            TOOL<span style={{color:'#e8e8e8'}}>CRIP</span>
          </div>
          <div className="mono text-xs tracking-widest" style={{color:'#444'}}>SISTEMA DE GESTIÓN DE INVENTARIO</div>
          <div className="mt-3 h-px" style={{background:'linear-gradient(to right, transparent, #f5a623, transparent)'}}/>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="mono text-xs tracking-widest mb-2 block" style={{color:'#555'}}>N° EMPLEADO</label>
            <input
              type="text"
              className="input-field mono"
              placeholder="EJ: EMP-001"
              value={empleado}
              onChange={e => setEmpleado(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mono text-xs tracking-widest mb-2 block" style={{color:'#555'}}>CONTRASEÑA</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="badge-danger px-3 py-2 w-full text-xs">{error}</div>
          )}
          <button type="submit" disabled={loading} className="btn-accent w-full justify-center py-3 mt-2 display text-base tracking-widest">
            {loading ? 'VERIFICANDO...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>

        <div className="mono text-center text-xs mt-6" style={{color:'#333'}}>
          TOOL CRIB MANAGER v2.0 — PRODUCCIÓN
        </div>
      </div>
    </div>
  )
}
