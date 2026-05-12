import { useEffect, useState } from 'react'
import { Package, ArrowLeftRight, AlertTriangle, Wrench, Ticket, TrendingUp } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const tipoColor = { ENTRADA:'#2ecc71', SALIDA:'#f5a623', DEVOLUCION:'#3b82f6', AJUSTE:'#8b5cf6', BAJA:'#e74c3c' }

// ─── Mini Bar Chart ───────────────────────────────────────────
function BarChart({ data, max, color, label }) {
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((item, i) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-sm transition-all" title={`${item.label}: ${item.value}`}
              style={{ height: `${Math.max(pct, 2)}%`, background: color, opacity: 0.8 + (i / data.length) * 0.2 }} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Horizontal Bar ───────────────────────────────────────────
function HBar({ label, value, max, color, sublabel }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <div>
          <span className="text-xs" style={{color:'#e8e8e8'}}>{label}</span>
          {sublabel && <span className="mono text-xs ml-2" style={{color:'#444'}}>{sublabel}</span>}
        </div>
        <span className="mono text-xs font-bold" style={{color}}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{background:'#1a1a1a'}}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{width:`${pct}%`, background: color}} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' }).toUpperCase()

  const maxSalidas = stats?.topMateriales?.length > 0 ? Math.max(...stats.topMateriales.map(m => m.totalCantidad)) : 1
  const maxSoli = stats?.topSolicitantes?.length > 0 ? Math.max(...stats.topSolicitantes.map(s => s._count.id)) : 1
  const maxMovs = stats?.movsSemana?.length > 0 ? Math.max(...stats.movsSemana.map(d => Math.max(d.entradas || 0, d.salidas || 0))) : 1

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="display text-4xl" style={{color:'#e8e8e8'}}>
            BIENVENIDO, <span style={{color:'#f5a623'}}>{user?.nombre?.split(' ')[0]}</span>
          </div>
          <div className="mono text-xs mt-1" style={{color:'#444', letterSpacing:'0.1em'}}>{dateStr}</div>
        </div>
        <div className="mono text-right" style={{color:'#333', fontSize:'10px'}}>
          <div>OPERADOR: {user?.empleado}</div>
          <div>ROL: {user?.role}</div>
        </div>
      </div>

      <div className="h-px mb-8" style={{background:'linear-gradient(to right, #f5a623, #2a2a2a)'}} />

      {loading ? <div className="mono text-xs" style={{color:'#444'}}>CARGANDO DATOS...</div> : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Package} label="TOTAL MATERIALES" value={stats?.totalHerr ?? 0} color="#f5a623" />
            <StatCard icon={Package} label="DISPONIBLES" value={stats?.disponibles ?? 0} color="#2ecc71" />
            <StatCard icon={Ticket} label="TICKETS PENDIENTES" value={stats?.ticketsPendientes ?? 0} color="#3b82f6"
              onClick={() => navigate('/app/tickets')} clickable />
            <StatCard icon={AlertTriangle} label="STOCK BAJO" value={stats?.stockBajo ?? 0} color="#e74c3c"
              onClick={() => navigate('/app/alertas')} clickable />
          </div>

          {/* Segunda fila de stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard icon={ArrowLeftRight} label="PRÉSTAMOS ACTIVOS" value={stats?.prestActivos ?? 0} color="#8b5cf6" />
            <StatCard icon={Wrench} label="EN MANTENIMIENTO" value={stats?.mantenimiento ?? 0} color="#6b7280" />
            <div className="stat-card" style={{borderLeftColor:'#f5a623'}}>
              <div className="mono text-xs mb-2" style={{color:'#555', fontSize:'10px'}}>ACTIVIDAD HOY</div>
              <div className="flex gap-4">
                <div>
                  <div className="display text-2xl" style={{color:'#2ecc71'}}>
                    {stats?.movsSemana?.[stats.movsSemana.length-1]?.entradas ?? 0}
                  </div>
                  <div className="mono text-xs" style={{color:'#444'}}>entradas</div>
                </div>
                <div>
                  <div className="display text-2xl" style={{color:'#f5a623'}}>
                    {stats?.movsSemana?.[stats.movsSemana.length-1]?.salidas ?? 0}
                  </div>
                  <div className="mono text-xs" style={{color:'#444'}}>salidas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas banner */}
          {stats?.stockBajo > 0 && (
            <button onClick={() => navigate('/app/alertas')}
              className="flex items-center gap-3 px-4 py-3 mb-6 w-full text-left transition-opacity hover:opacity-80"
              style={{background:'#f5a62310', border:'1px solid #f5a62330'}}>
              <AlertTriangle size={16} style={{color:'#f5a623'}} />
              <span className="mono text-xs" style={{color:'#f5a623'}}>
                {stats.stockBajo} MATERIAL(ES) CON STOCK BAJO — HAZ CLIC PARA VER ALERTAS
              </span>
            </button>
          )}

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Top materiales */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={14} style={{color:'#f5a623'}} />
                <span className="mono text-xs tracking-widest" style={{color:'#555'}}>MATERIALES MÁS SOLICITADOS</span>
              </div>
              {stats?.topMateriales?.length > 0 ? (
                <div>
                  {stats.topMateriales.map((m, i) => (
                    <HBar key={i}
                      label={m.nombre || '—'}
                      sublabel={m.codigo}
                      value={m.totalCantidad}
                      max={maxSalidas}
                      color={['#f5a623','#e8950f','#d4840e','#c0730d','#ac620c'][i]}
                    />
                  ))}
                </div>
              ) : (
                <div className="mono text-xs text-center py-6" style={{color:'#333'}}>
                  SIN DATOS — REGISTRA SALIDAS PARA VER ESTADÍSTICAS
                </div>
              )}
            </div>

            {/* Movimientos 7 días */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} style={{color:'#3b82f6'}} />
                <span className="mono text-xs tracking-widest" style={{color:'#555'}}>MOVIMIENTOS ÚLTIMOS 7 DÍAS</span>
              </div>
              {stats?.movsSemana && (
                <>
                  <div className="flex gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm" style={{background:'#2ecc71'}} />
                      <span className="mono text-xs" style={{color:'#555'}}>Entradas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm" style={{background:'#f5a623'}} />
                      <span className="mono text-xs" style={{color:'#555'}}>Salidas</span>
                    </div>
                  </div>
                  {/* Barras agrupadas */}
                  <div className="flex items-end gap-2 h-24 mb-2">
                    {stats.movsSemana.map((d, i) => {
                      const entPct = maxMovs > 0 ? ((d.entradas || 0) / maxMovs) * 100 : 0
                      const salPct = maxMovs > 0 ? ((d.salidas || 0) / maxMovs) * 100 : 0
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="flex items-end gap-0.5 w-full h-20">
                            <div className="flex-1 rounded-sm" title={`Entradas: ${d.entradas}`}
                              style={{height:`${Math.max(entPct, entPct > 0 ? 4 : 0)}%`, background:'#2ecc71', opacity:0.8}} />
                            <div className="flex-1 rounded-sm" title={`Salidas: ${d.salidas}`}
                              style={{height:`${Math.max(salPct, salPct > 0 ? 4 : 0)}%`, background:'#f5a623', opacity:0.8}} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Labels días */}
                  <div className="flex gap-2">
                    {stats.movsSemana.map((d, i) => (
                      <div key={i} className="flex-1 text-center mono" style={{color:'#444', fontSize:'8px'}}>
                        {d.dia.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top solicitantes + últimos movimientos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top solicitantes */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={14} style={{color:'#8b5cf6'}} />
                <span className="mono text-xs tracking-widest" style={{color:'#555'}}>TOP SOLICITANTES</span>
              </div>
              {stats?.topSolicitantes?.length > 0 ? (
                stats.topSolicitantes.map((s, i) => (
                  <HBar key={i}
                    label={s.solicitante}
                    value={s._count.id}
                    max={maxSoli}
                    color={['#8b5cf6','#7c3aed','#6d28d9','#5b21b6','#4c1d95'][i]}
                  />
                ))
              ) : (
                <div className="mono text-xs text-center py-6" style={{color:'#333'}}>SIN DATOS</div>
              )}
            </div>

            {/* Últimos movimientos */}
            <div className="card">
              <div className="px-5 py-4 border-b" style={{borderColor:'#1a1a1a'}}>
                <span className="mono text-xs tracking-widest" style={{color:'#555'}}>ÚLTIMOS MOVIMIENTOS</span>
              </div>
              <table className="w-full">
                <tbody>
                  {(stats?.ultimosMovs || []).map(m => (
                    <tr key={m.id} className="table-row">
                      <td className="td mono text-xs" style={{color:'#555', minWidth:'60px'}}>
                        {new Date(m.createdAt).toLocaleDateString('es-MX', {day:'2-digit',month:'short'})}
                      </td>
                      <td className="td">
                        <div className="text-xs" style={{color:'#e8e8e8'}}>{m.herramienta?.nombre}</div>
                      </td>
                      <td className="td">
                        <span className="mono text-xs font-semibold" style={{color: tipoColor[m.tipo]}}>{m.tipo}</span>
                      </td>
                      <td className="td mono text-xs" style={{color:'#555'}}>{m.cantidad}</td>
                    </tr>
                  ))}
                  {!stats?.ultimosMovs?.length && (
                    <tr><td colSpan={4} className="td mono text-xs text-center" style={{color:'#333'}}>SIN MOVIMIENTOS</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick, clickable }) {
  return (
    <div
      onClick={onClick}
      className="stat-card"
      style={{
        borderLeftColor: color,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'opacity 0.15s'
      }}
      onMouseEnter={e => clickable && (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => clickable && (e.currentTarget.style.opacity = '1')}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="mono tracking-widest" style={{color:'#555', fontSize:'9px'}}>{label}</span>
        <Icon size={14} style={{color}} />
      </div>
      <div className="display text-4xl" style={{color}}>{value}</div>
      {clickable && <div className="mono text-xs mt-2" style={{color:'#333', fontSize:'9px'}}>CLIC PARA VER →</div>}
    </div>
  )
}
