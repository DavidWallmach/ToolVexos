import { useEffect, useState } from 'react'
import { Package, CircleCheck, AlertTriangle, Ticket, Calendar, Search, Download } from 'lucide-react'
import api from '../lib/api'
import { Link, useNavigate } from 'react-router-dom'

const INK = 'var(--text)'
const INK2 = 'var(--text-2)'
const MUTED = 'var(--muted)'
const BORDER = 'var(--border)'
const ACCENT = 'var(--accent)'
const SERIE = { entradas: '#3b82f6', salidas: '#d97706' }
const TIPOS = {
  ENTRADA: 'Entrada', SALIDA: 'Salida', DEVOLUCION: 'Devolución', AJUSTE: 'Ajuste', BAJA: 'Baja',
}

const iniciales = (nombre = '') => nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '—'

const fechaDeMes = (mes) => {
  const [anio, m] = mes.split('-').map(Number)
  return new Date(anio, m - 1, 1)
}
const nombreMes = (mes) => {
  const t = fechaDeMes(mes).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')
  return t[0].toUpperCase() + t.slice(1)
}
const fechaCorta = (d) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

// Eje con 4 divisiones redondas (1, 2, 5, 10...) y siempre en piezas enteras
const escala = (max) => {
  if (max <= 0) return { paso: 1, tope: 4 }
  const bruto = max / 4
  const magnitud = 10 ** Math.floor(Math.log10(bruto))
  const paso = Math.max(1, Math.ceil([1, 2, 5, 10].map(f => f * magnitud).find(v => v >= bruto)))
  return { paso, tope: paso * 4 }
}

const celdaCsv = (valor) => {
  const texto = String(valor ?? '')
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto
  return `"${seguro.replace(/"/g, '""')}"`
}

const descargarCsv = (stats) => {
  const filas = [
    ['Salidas por mes'], ['Mes', 'Piezas'],
    ...(stats.salidasMensuales || []).map(m => [m.mes, m.cantidad]),
    [], ['Últimos movimientos'], ['Fecha', 'Material', 'Tipo', 'Cantidad', 'Usuario'],
    ...(stats.ultimosMovs || []).map(m => [new Date(m.createdAt).toISOString().slice(0, 10), m.herramienta?.nombre, m.tipo, m.cantidad, m.user?.nombre]),
  ]
  const csv = '﻿' + filas.map(f => f.map(celdaCsv).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Gráfica de barras mensual ────────────────────────────────
function GraficaMensual({ datos }) {
  const [activo, setActivo] = useState(null)
  const { paso, tope } = escala(Math.max(0, ...datos.map(d => d.cantidad)))
  const marcas = [4, 3, 2, 1, 0].map(i => i * paso)
  const total = datos.reduce((t, d) => t + d.cantidad, 0)

  if (!datos.length || total === 0) {
    return <div className="text-sm flex items-center justify-center h-56 text-center" style={{ color: MUTED }}>Aún no hay salidas en los últimos 12 meses.</div>
  }

  return (
    <div>
      <div className="relative h-56 sm:h-72" role="img" aria-label={`Salidas por mes, ${total} piezas en 12 meses`}>
        {marcas.map(v => (
          <div key={v} className="absolute left-0 right-0 flex items-center gap-2" style={{ bottom: `${(v / tope) * 100}%`, transform: 'translateY(50%)' }}>
            <span className="w-8 text-right text-xs tabular-nums" style={{ color: MUTED }}>{v}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--surface2)' }} />
          </div>
        ))}
        <div className="absolute inset-y-0 right-0 flex items-end gap-1 sm:gap-2" style={{ left: '2.5rem' }}>
          {datos.map((d, i) => (
            <div key={d.mes} className="relative flex-1 h-full flex items-end justify-center"
              onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)}>
              {d.cantidad > 0 && (
                <div className="w-full transition-opacity" style={{
                  maxWidth: '44px', height: `${(d.cantidad / tope) * 100}%`, background: ACCENT,
                  borderRadius: '4px 4px 0 0', opacity: activo === null || activo === i ? 1 : 0.45,
                }} />
              )}
              {activo === i && (
                <div className="absolute z-10 px-2.5 py-1.5 text-xs whitespace-nowrap rounded-md pointer-events-none" style={{
                  bottom: `calc(${(d.cantidad / tope) * 100}% + 8px)`,
                  ...(i < 2 ? { left: 0 } : i > datos.length - 3 ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' }),
                  background: 'var(--surface2)', border: `1px solid ${BORDER}`, color: INK,
                }}>
                  {nombreMes(d.mes)} {d.mes.slice(0, 4)}: <b>{d.cantidad}</b> pzas
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-1 sm:gap-2 mt-2" style={{ paddingLeft: '2.5rem' }}>
        {datos.map(d => (
          <span key={d.mes} className="flex-1 text-center text-xs truncate" style={{ color: MUTED }}>{nombreMes(d.mes)}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Piezas despachadas por mes</caption>
        <tbody>{datos.map(d => <tr key={d.mes}><th scope="row">{d.mes}</th><td>{d.cantidad}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

// ─── Gráfica de la semana (entradas / salidas) ────────────────
function GraficaSemana({ datos }) {
  const max = Math.max(1, ...datos.flatMap(d => [d.entradas || 0, d.salidas || 0]))
  const Barra = ({ valor, color, etiqueta }) => (
    <div className="flex-1 min-h-0" title={`${etiqueta}: ${valor}`} style={{
      height: valor > 0 ? `${Math.max((valor / max) * 100, 4)}%` : 0, background: color, borderRadius: '4px 4px 0 0',
    }} />
  )
  return (
    <div>
      <div className="flex gap-4 mb-4">
        {[['Entradas', SERIE.entradas], ['Salidas', SERIE.salidas]].map(([t, c]) => (
          <div key={t} className="flex items-center gap-1.5 text-xs" style={{ color: INK2 }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{t}
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2 h-40">
        {datos.map(d => (
          <div key={d.dia} className="flex-1 h-full flex items-end justify-center gap-0.5">
            <Barra valor={d.entradas || 0} color={SERIE.entradas} etiqueta={`${d.dia} entradas`} />
            <Barra valor={d.salidas || 0} color={SERIE.salidas} etiqueta={`${d.dia} salidas`} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2 pt-2 border-t" style={{ borderColor: BORDER }}>
        {datos.map(d => <span key={d.dia} className="flex-1 text-center text-xs truncate capitalize" style={{ color: MUTED }}>{d.dia.split(' ')[0].toLowerCase()}</span>)}
      </div>
    </div>
  )
}

function BarraRanking({ etiqueta, detalle, valor, max }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between gap-3 mb-1.5 text-sm">
        <span className="truncate" style={{ color: INK }}>{etiqueta}{detalle && <span className="mono ml-2 text-xs" style={{ color: MUTED }}>{detalle}</span>}</span>
        <span className="font-semibold tabular-nums" style={{ color: INK }}>{valor}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded-full" style={{ width: `${max > 0 ? (valor / max) * 100 : 0}%`, background: ACCENT }} />
      </div>
    </div>
  )
}

function Tarjeta({ titulo, subtitulo, children, className = '' }) {
  return (
    <section className={`card p-5 ${className}`}>
      <h2 className="text-base font-semibold" style={{ color: INK }}>{titulo}</h2>
      {subtitulo && <p className="text-sm mt-0.5" style={{ color: MUTED }}>{subtitulo}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function StatCard({ icon: Icon, label, value, detalle, color, onClick }) {
  const Elemento = onClick ? 'button' : 'div'
  return (
    <Elemento onClick={onClick} className={`stat-card block w-full text-left ${onClick ? 'transition-colors hover:bg-[var(--hover)]' : ''}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-medium" style={{ color: INK2 }}>{label}</span>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="text-3xl font-semibold tabular-nums" style={{ color: INK }}>{value}</div>
      <p className="text-xs mt-1" style={{ color: MUTED }}>{detalle}</p>
    </Elemento>
  )
}

function Avatar({ nombre }) {
  return (
    <span className="mono flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-xs font-semibold"
      style={{ background: 'var(--surface2)', color: ACCENT }}>{iniciales(nombre)}</span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('resumen')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1)
  const movs = stats?.ultimosMovs || []
  const maxMateriales = Math.max(0, ...(stats?.topMateriales || []).map(m => m.totalCantidad))
  const maxSolicitantes = Math.max(0, ...(stats?.topSolicitantes || []).map(s => s._count.id))

  const buscar = (e) => {
    e.preventDefault()
    const q = busqueda.trim()
    navigate(q ? `/app/inventario?search=${encodeURIComponent(q)}` : '/app/inventario')
  }

  const pestanas = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'analitica', label: 'Analítica' },
    { to: '/app/reportes', label: 'Reportes' },
    { to: '/app/alertas', label: 'Alertas' },
  ]

  return (
    <div className="page-padding">
      {/* Título y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="display text-4xl" style={{ color: INK }}>Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={buscar} className="flex items-center gap-2 px-3 py-2 border rounded-lg w-full sm:w-56" style={{ background: 'var(--surface)', borderColor: BORDER }}>
            <Search size={15} style={{ color: MUTED }} />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar material..." aria-label="Buscar material"
              className="w-full bg-transparent text-sm outline-none placeholder-[#8b919b]" style={{ color: INK }} />
          </form>
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: BORDER, color: INK2 }}>
            <Calendar size={15} style={{ color: MUTED }} />
            {fechaCorta(inicio)} - {fechaCorta(hoy)}
          </div>
          <button onClick={() => stats && descargarCsv(stats)} disabled={!stats} className="btn-accent disabled:opacity-50">
            <Download size={15} /> Descargar
          </button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="inline-flex flex-wrap gap-1 p-1 mb-6 rounded-lg" style={{ background: 'var(--surface)' }}>
        {pestanas.map(p => p.to ? (
          <Link key={p.to} to={p.to} className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-[var(--text)]" style={{ color: MUTED }}>{p.label}</Link>
        ) : (
          <button key={p.id} onClick={() => setTab(p.id)} aria-pressed={tab === p.id} className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={tab === p.id ? { background: 'var(--surface2)', color: INK } : { color: MUTED }}>{p.label}</button>
        ))}
      </div>

      {loading ? <p className="text-sm" style={{ color: MUTED }}>Cargando datos...</p> : !stats ? (
        <p className="text-sm" style={{ color: 'var(--red)' }}>No se pudieron cargar los datos del dashboard.</p>
      ) : tab === 'resumen' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <StatCard icon={Package} label="Total de materiales" value={stats.totalHerr ?? 0} color={ACCENT} detalle={`${stats.mantenimiento ?? 0} en mantenimiento`} onClick={() => navigate('/app/inventario')} />
            <StatCard icon={CircleCheck} label="Disponibles" value={stats.disponibles ?? 0} color="var(--green)" detalle={`${stats.prestActivos ?? 0} préstamos activos`} />
            <StatCard icon={Ticket} label="Tickets pendientes" value={stats.ticketsPendientes ?? 0} color="var(--blue)" detalle="Revisar solicitudes →" onClick={() => navigate('/app/tickets')} />
            <StatCard icon={AlertTriangle} label="Stock bajo" value={stats.stockBajo ?? 0} color="var(--red)" detalle="Ver alertas →" onClick={() => navigate('/app/alertas')} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-7 gap-4">
            <Tarjeta titulo="Salidas por mes" subtitulo="Piezas despachadas en los últimos 12 meses" className="xl:col-span-4">
              <GraficaMensual datos={stats.salidasMensuales || []} />
            </Tarjeta>

            <Tarjeta titulo="Últimos movimientos" subtitulo="Lo más reciente del almacén" className="xl:col-span-3">
              {movs.length ? (
                <ul className="space-y-4">
                  {movs.map(m => {
                    const suma = ['ENTRADA', 'DEVOLUCION'].includes(m.tipo)
                    return (
                      <li key={m.id} className="flex items-center gap-3">
                        <Avatar nombre={m.user?.nombre} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate" style={{ color: INK }}>{m.herramienta?.nombre || '—'}</div>
                          <div className="text-xs truncate" style={{ color: MUTED }}>
                            {TIPOS[m.tipo] || m.tipo} · {m.user?.nombre} · {new Date(m.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                        <span className="font-semibold tabular-nums whitespace-nowrap" style={{ color: suma ? 'var(--green)' : INK }}>{suma ? '+' : '−'}{m.cantidad}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : <p className="text-sm" style={{ color: MUTED }}>Sin movimientos todavía.</p>}
            </Tarjeta>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Tarjeta titulo="Movimientos de los últimos 7 días" subtitulo="Número de registros por día" className="lg:col-span-2">
            <GraficaSemana datos={stats.movsSemana || []} />
          </Tarjeta>
          <Tarjeta titulo="Materiales más solicitados" subtitulo="Piezas despachadas en total">
            {stats.topMateriales?.length ? stats.topMateriales.map(m => (
              <BarraRanking key={m.codigo} etiqueta={m.nombre || '—'} detalle={m.codigo} valor={m.totalCantidad} max={maxMateriales} />
            )) : <p className="text-sm" style={{ color: MUTED }}>Registra salidas para ver estadísticas.</p>}
          </Tarjeta>
          <Tarjeta titulo="Principales solicitantes" subtitulo="Número de salidas">
            {stats.topSolicitantes?.length ? stats.topSolicitantes.map(s => (
              <BarraRanking key={s.solicitante} etiqueta={s.solicitante} valor={s._count.id} max={maxSolicitantes} />
            )) : <p className="text-sm" style={{ color: MUTED }}>Sin datos todavía.</p>}
          </Tarjeta>
        </div>
      )}
    </div>
  )
}
