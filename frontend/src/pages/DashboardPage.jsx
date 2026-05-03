import { useEffect, useState } from 'react'
import { Package, ArrowLeftRight, AlertTriangle, Wrench, Clock } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'

const tipoColor = { ENTRADA:'text-green-400', SALIDA:'text-[#f5a623]', DEVOLUCION:'text-blue-400', AJUSTE:'text-purple-400', BAJA:'text-red-400' }

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' }).toUpperCase()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="display text-4xl" style={{color:'#e8e8e8'}}>BIENVENIDO, <span style={{color:'#f5a623'}}>{user?.nombre?.split(' ')[0]}</span></div>
          <div className="mono text-xs mt-1" style={{color:'#444', letterSpacing:'0.1em'}}>{dateStr}</div>
        </div>
        <div className="mono text-right" style={{color:'#333', fontSize:'10px'}}>
          <div>OPERADOR: {user?.empleado}</div>
          <div>ROL: {user?.role}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mb-8" style={{background:'linear-gradient(to right, #f5a623, #2a2a2a)'}} />

      {/* Stats */}
      {loading ? (
        <div className="mono text-xs" style={{color:'#444'}}>CARGANDO DATOS...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Package} label="TOTAL HERRAMIENTAS" value={stats?.totalHerr ?? 0} color="#f5a623" />
            <StatCard icon={Package} label="DISPONIBLES" value={stats?.disponibles ?? 0} color="#2ecc71" />
            <StatCard icon={ArrowLeftRight} label="EN PRÉSTAMO" value={stats?.prestActivos ?? 0} color="#3b82f6" />
            <StatCard icon={Wrench} label="EN MANTENIMIENTO" value={stats?.mantenimiento ?? 0} color="#8b5cf6" />
          </div>

          {stats?.stockBajo > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 mb-6 border" style={{background:'#f5a62310', borderColor:'#f5a62330'}}>
              <AlertTriangle size={16} style={{color:'#f5a623'}} />
              <span className="mono text-xs" style={{color:'#f5a623'}}>
                {stats.stockBajo} HERRAMIENTA(S) CON STOCK BAJO — REVISAR INVENTARIO
              </span>
            </div>
          )}

          {/* Últimos movimientos */}
          <div className="card">
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{borderColor:'#1a1a1a'}}>
              <Clock size={14} style={{color:'#555'}} />
              <span className="mono text-xs tracking-widest" style={{color:'#555'}}>ÚLTIMOS MOVIMIENTOS</span>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  {['FECHA','HERRAMIENTA','TIPO','CANT.','USUARIO'].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.ultimosMovs || []).map(m => (
                  <tr key={m.id} className="table-row">
                    <td className="td mono text-xs" style={{color:'#555'}}>{new Date(m.createdAt).toLocaleDateString('es-MX')}</td>
                    <td className="td">
                      <div className="text-xs" style={{color:'#e8e8e8'}}>{m.herramienta?.nombre}</div>
                      <div className="mono text-xs" style={{color:'#444'}}>{m.herramienta?.codigo}</div>
                    </td>
                    <td className="td"><span className={`mono text-xs font-semibold ${tipoColor[m.tipo]}`}>{m.tipo}</span></td>
                    <td className="td mono text-xs" style={{color:'#888'}}>{m.cantidad}</td>
                    <td className="td mono text-xs" style={{color:'#555'}}>{m.user?.nombre}</td>
                  </tr>
                ))}
                {!stats?.ultimosMovs?.length && (
                  <tr><td colSpan={5} className="td mono text-xs text-center" style={{color:'#333'}}>SIN MOVIMIENTOS REGISTRADOS</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card" style={{borderLeftColor: color}}>
      <div className="flex items-center justify-between mb-3">
        <span className="mono text-xs tracking-widest" style={{color:'#555', fontSize:'10px'}}>{label}</span>
        <Icon size={14} style={{color}} />
      </div>
      <div className="display text-4xl" style={{color}}>{value}</div>
    </div>
  )
}
