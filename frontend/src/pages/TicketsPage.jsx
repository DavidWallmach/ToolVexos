import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const statusColor = {
  PENDIENTE: '#f5a623',
  PARCIAL: '#3b82f6',
  DESPACHADO: '#2ecc71',
  RECHAZADO: '#e74c3c'
}
const statusBg = {
  PENDIENTE: '#f5a62310',
  PARCIAL: '#3b82f610',
  DESPACHADO: '#2ecc7110',
  RECHAZADO: '#e74c3c10'
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('PENDIENTE')
  const [loading, setLoading] = useState(true)
  const [despachoModal, setDespachoModal] = useState(null)
  const [rechazarModal, setRechazarModal] = useState(null)
  const [cantidadDespachar, setCantidadDespachar] = useState('')
  const [nota, setNota] = useState('')

  const load = async () => {
    setLoading(true)
    const params = filter !== 'TODOS' ? { status: filter } : {}
    const { data } = await api.get('/tickets', { params })
    setTickets(data.tickets)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const handleDespachar = async () => {
    if (!cantidadDespachar || +cantidadDespachar <= 0) return toast.error('Ingresa una cantidad válida')
    try {
      const { data } = await api.post(`/tickets/${despachoModal.id}/despachar`, {
        cantidadDespachar: +cantidadDespachar,
        nota
      })
      toast.success(data.message)
      setDespachoModal(null)
      setCantidadDespachar('')
      setNota('')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error al despachar') }
  }

  const handleRechazar = async () => {
    try {
      await api.post(`/tickets/${rechazarModal.id}/rechazar`, { nota })
      toast.success('Ticket rechazado')
      setRechazarModal(null)
      setNota('')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const pendingCount = tickets.filter(t => ['PENDIENTE','PARCIAL'].includes(t.status)).length

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="display text-3xl" style={{color:'#e8e8e8'}}>TICKETS DE SOLICITUD</div>
        <div className="mono text-xs mt-0.5" style={{color:'#444'}}>
          {pendingCount > 0 ? `${pendingCount} TICKET(S) REQUIEREN ATENCIÓN` : 'GESTIÓN DE SOLICITUDES'}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 mb-5 p-1 w-fit" style={{background:'#111', border:'1px solid #1a1a1a'}}>
        {['PENDIENTE','PARCIAL','DESPACHADO','RECHAZADO','TODOS'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="mono px-4 py-2 text-xs transition-all"
            style={{
              background: filter === f ? statusColor[f] || '#f5a623' : 'transparent',
              color: filter === f ? '#000' : '#555',
              fontWeight: filter === f ? '700' : '400',
              letterSpacing: '0.08em'
            }}
          >{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? <div className="mono text-xs" style={{color:'#333'}}>CARGANDO...</div>
        : tickets.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="mono text-xs" style={{color:'#333'}}>NO HAY TICKETS {filter !== 'TODOS' ? `CON STATUS "${filter}"` : ''}</div>
          </div>
        ) : tickets.map(t => {
          const pendiente = t.cantidad - (t.cantidadDespachada || 0)
          const stockDisp = t.herramienta?.stockDisp || 0
          const puedeDespachar = ['PENDIENTE','PARCIAL'].includes(t.status)

          return (
            <div key={t.id} className="card p-5" style={{borderLeft:`2px solid ${statusColor[t.status]}`, background: statusBg[t.status]}}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="mono text-xs font-bold" style={{color:'#f5a623'}}>{t.folio}</span>
                    <span className="mono text-xs font-bold px-2 py-0.5" style={{background: statusColor[t.status]+'20', color: statusColor[t.status], border:`1px solid ${statusColor[t.status]}40`}}>
                      {t.status}
                    </span>
                    <span className="mono text-xs" style={{color:'#444'}}>{new Date(t.createdAt).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>MATERIAL</div>
                      <div className="text-sm font-medium" style={{color:'#e8e8e8'}}>{t.herramienta?.nombre}</div>
                      <div className="mono text-xs" style={{color:'#555'}}>{t.herramienta?.codigo}</div>
                    </div>
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>CANTIDAD</div>
                      <div className="display text-2xl" style={{color:'#f5a623'}}>{t.cantidad}</div>
                      <div className="mono text-xs" style={{color:'#555'}}>{t.herramienta?.unidad} solicitadas</div>
                    </div>
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>PROGRESO</div>
                      <div className="display text-2xl" style={{color: statusColor[t.status]}}>
                        {t.cantidadDespachada || 0}/{t.cantidad}
                      </div>
                      <div className="mono text-xs" style={{color:'#555'}}>
                        {pendiente > 0 ? `${pendiente} pendiente(s)` : 'completo'}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {t.cantidadDespachada > 0 && (
                    <div className="mb-3">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{background:'#2a2a2a'}}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${(t.cantidadDespachada / t.cantidad) * 100}%`,
                            background: statusColor[t.status]
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>SOLICITANTE</div>
                      <div className="text-sm" style={{color:'#e8e8e8'}}>{t.user?.nombre}</div>
                      <div className="mono text-xs" style={{color:'#555'}}>{t.user?.empleado} · {t.user?.role}</div>
                    </div>
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>MOTIVO / OPERADOR</div>
                      <div className="text-xs" style={{color:'#888'}}>
                        {t.motivo.includes('| Operador:') ? t.motivo.split('| Operador:')[0].trim() : t.motivo}
                      </div>
                      {t.motivo.includes('| Operador:') && (
                        <div className="mono text-xs mt-0.5" style={{color:'#f5a623'}}>
                          👷 {t.motivo.split('| Operador:')[1].trim()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock disponible */}
                  {puedeDespachar && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="mono text-xs px-2 py-1" style={{background:'#1a1a1a', color: stockDisp > 0 ? '#2ecc71' : '#e74c3c', border:`1px solid ${stockDisp > 0 ? '#2ecc7130' : '#e74c3c30'}`}}>
                        STOCK ACTUAL: {stockDisp} {t.herramienta?.unidad}
                      </div>
                      {stockDisp === 0 && (
                        <div className="flex items-center gap-1 mono text-xs" style={{color:'#e74c3c'}}>
                          <AlertTriangle size={11} /> SIN STOCK
                        </div>
                      )}
                    </div>
                  )}

                  {t.nota && (
                    <div className="mt-2 px-3 py-2 border-l-2" style={{borderColor: statusColor[t.status], background:'#0a0a0a'}}>
                      <div className="mono text-xs mb-0.5" style={{color:'#444'}}>NOTA:</div>
                      <div className="text-xs" style={{color:'#888'}}>{t.nota}</div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                {puedeDespachar && (
                  <div className="flex flex-col gap-2 min-w-fit">
                    <button
                      onClick={() => { setDespachoModal(t); setCantidadDespachar(String(Math.min(pendiente, stockDisp))) }}
                      disabled={stockDisp === 0}
                      className="flex items-center gap-2 px-4 py-2.5 mono text-xs font-bold transition-all"
                      style={{
                        background: stockDisp > 0 ? '#2ecc7120' : '#2a2a2a',
                        color: stockDisp > 0 ? '#2ecc71' : '#444',
                        border: `1px solid ${stockDisp > 0 ? '#2ecc7140' : '#2a2a2a'}`,
                        cursor: stockDisp === 0 ? 'not-allowed' : 'pointer'
                      }}>
                      <CheckCircle size={13} /> DESPACHAR
                    </button>
                    <button
                      onClick={() => { setRechazarModal(t); setNota('') }}
                      className="flex items-center gap-2 px-4 py-2.5 mono text-xs font-bold transition-all"
                      style={{background:'#e74c3c20', color:'#e74c3c', border:'1px solid #e74c3c40'}}>
                      <XCircle size={13} /> RECHAZAR
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal despacho */}
      {despachoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.92)'}}>
          <div className="w-full max-w-sm card p-6">
            <div className="mb-4">
              <div className="display text-xl mb-1" style={{color:'#2ecc71'}}>DESPACHAR MATERIAL</div>
              <div className="mono text-xs" style={{color:'#555'}}>{despachoModal.folio} — {despachoModal.herramienta?.nombre}</div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-3 text-center" style={{background:'#1a1a1a', border:'1px solid #2a2a2a'}}>
                <div className="mono text-xs mb-1" style={{color:'#555', fontSize:'9px'}}>SOLICITADO</div>
                <div className="display text-xl" style={{color:'#f5a623'}}>{despachoModal.cantidad - (despachoModal.cantidadDespachada||0)}</div>
                <div className="mono text-xs" style={{color:'#444'}}>{despachoModal.herramienta?.unidad}</div>
              </div>
              <div className="p-3 text-center" style={{background:'#1a1a1a', border:'1px solid #2a2a2a'}}>
                <div className="mono text-xs mb-1" style={{color:'#555', fontSize:'9px'}}>EN STOCK</div>
                <div className="display text-xl" style={{color:'#2ecc71'}}>{despachoModal.herramienta?.stockDisp}</div>
                <div className="mono text-xs" style={{color:'#444'}}>{despachoModal.herramienta?.unidad}</div>
              </div>
              <div className="p-3 text-center" style={{background:'#1a1a1a', border:'1px solid #2a2a2a'}}>
                <div className="mono text-xs mb-1" style={{color:'#555', fontSize:'9px'}}>YA DADO</div>
                <div className="display text-xl" style={{color:'#3b82f6'}}>{despachoModal.cantidadDespachada||0}</div>
                <div className="mono text-xs" style={{color:'#444'}}>{despachoModal.herramienta?.unidad}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>
                  CANTIDAD A DESPACHAR AHORA
                </label>
                <input
                  type="number"
                  min="1"
                  max={Math.min(despachoModal.cantidad - (despachoModal.cantidadDespachada||0), despachoModal.herramienta?.stockDisp || 0)}
                  className="input-field mono text-lg"
                  value={cantidadDespachar}
                  onChange={e => setCantidadDespachar(e.target.value)}
                />
                {+cantidadDespachar < (despachoModal.cantidad - (despachoModal.cantidadDespachada||0)) && cantidadDespachar !== '' && (
                  <div className="mono text-xs mt-1" style={{color:'#3b82f6'}}>
                    ⚠ Despacho parcial — quedarán {(despachoModal.cantidad - (despachoModal.cantidadDespachada||0)) - +cantidadDespachar} pendiente(s)
                  </div>
                )}
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>NOTA (opcional)</label>
                <input className="input-field" value={nota} onChange={e => setNota(e.target.value)}
                  placeholder="Ej: Se entrega lo disponible, resto el lunes..." />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setDespachoModal(null); setCantidadDespachar(''); setNota('') }}
                  className="btn-ghost flex-1 justify-center mono text-xs">CANCELAR</button>
                <button onClick={handleDespachar}
                  className="flex-1 justify-center display tracking-widest py-2 px-4 text-sm font-bold"
                  style={{background:'#2ecc71', color:'#000'}}>
                  CONFIRMAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal rechazar */}
      {rechazarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.92)'}}>
          <div className="w-full max-w-sm card p-6">
            <div className="mb-4">
              <div className="display text-xl mb-1" style={{color:'#e74c3c'}}>RECHAZAR TICKET</div>
              <div className="mono text-xs" style={{color:'#555'}}>{rechazarModal.folio} — {rechazarModal.herramienta?.nombre}</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>MOTIVO DEL RECHAZO</label>
                <textarea className="input-field h-20 resize-none" value={nota} onChange={e => setNota(e.target.value)}
                  placeholder="Ej: Sin stock, material en mantenimiento..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setRechazarModal(null); setNota('') }}
                  className="btn-ghost flex-1 justify-center mono text-xs">CANCELAR</button>
                <button onClick={handleRechazar}
                  className="flex-1 justify-center display tracking-widest py-2 px-4 text-sm font-bold"
                  style={{background:'#e74c3c', color:'#fff'}}>
                  RECHAZAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
