import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const statusColor = { PENDIENTE:'#f5a623', APROBADO:'#2ecc71', DESPACHADO:'#2ecc71', RECHAZADO:'#e74c3c' }
const statusBg = { PENDIENTE:'#f5a62315', APROBADO:'#2ecc7115', DESPACHADO:'#2ecc7115', RECHAZADO:'#e74c3c15' }

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('PENDIENTE')
  const [loading, setLoading] = useState(true)
  const [notaModal, setNotaModal] = useState(null) // { ticket, action }
  const [nota, setNota] = useState('')

  const load = async () => {
    setLoading(true)
    const params = filter !== 'TODOS' ? { status: filter } : {}
    const { data } = await api.get('/tickets', { params })
    setTickets(data.tickets)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const handleAction = async (action) => {
    try {
      const endpoint = action === 'aprobar' ? 'aprobar' : 'rechazar'
      await api.post(`/tickets/${notaModal.ticket.id}/${endpoint}`, { nota })
      toast.success(action === 'aprobar' ? '✅ Ticket aprobado y despachado' : '❌ Ticket rechazado')
      setNotaModal(null)
      setNota('')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const pendingCount = tickets.filter(t => t.status === 'PENDIENTE').length

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="display text-3xl" style={{color:'#e8e8e8'}}>TICKETS DE SOLICITUD</div>
        <div className="mono text-xs mt-0.5" style={{color:'#444'}}>
          {filter === 'PENDIENTE' && pendingCount > 0
            ? `${pendingCount} TICKET(S) ESPERANDO TU APROBACIÓN`
            : 'GESTIÓN DE SOLICITUDES DE MATERIAL'}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 mb-5 p-1 w-fit" style={{background:'#111', border:'1px solid #1a1a1a'}}>
        {['PENDIENTE','DESPACHADO','RECHAZADO','TODOS'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="mono px-4 py-2 text-xs transition-all"
            style={{
              background: filter === f ? '#f5a623' : 'transparent',
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
        ) : tickets.map(t => (
          <div key={t.id} className="card p-5" style={{borderLeft:`2px solid ${statusColor[t.status]}`, background: statusBg[t.status]}}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="mono text-xs font-bold" style={{color:'#f5a623'}}>{t.folio}</span>
                  <span className="mono text-xs font-bold" style={{color: statusColor[t.status]}}>{t.status}</span>
                  <span className="mono text-xs" style={{color:'#444'}}>{new Date(t.createdAt).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}</span>
                </div>

                {/* Material */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>MATERIAL</div>
                    <div className="text-sm font-medium" style={{color:'#e8e8e8'}}>{t.herramienta?.nombre}</div>
                    <div className="mono text-xs" style={{color:'#555'}}>{t.herramienta?.codigo}</div>
                  </div>
                  <div>
                    <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>CANTIDAD</div>
                    <div className="display text-2xl" style={{color:'#f5a623'}}>{t.cantidad}</div>
                    <div className="mono text-xs" style={{color:'#555'}}>{t.herramienta?.unidad}</div>
                  </div>
                </div>

                {/* Solicitante */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>SOLICITANTE</div>
                    <div className="text-sm" style={{color:'#e8e8e8'}}>{t.user?.nombre}</div>
                    <div className="mono text-xs" style={{color:'#555'}}>{t.user?.empleado} · {t.user?.role}</div>
                  </div>
                  <div>
                    <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>MOTIVO</div>
                    <div className="text-sm" style={{color:'#888'}}>{t.motivo}</div>
                  </div>
                </div>

                {t.nota && (
                  <div className="mt-2 px-3 py-2 border-l-2" style={{borderColor: statusColor[t.status], background:'#0a0a0a'}}>
                    <div className="mono text-xs mb-0.5" style={{color:'#444'}}>NOTA:</div>
                    <div className="text-xs" style={{color:'#888'}}>{t.nota}</div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              {t.status === 'PENDIENTE' && (
                <div className="flex flex-col gap-2 min-w-fit">
                  <button onClick={() => setNotaModal({ ticket: t, action: 'aprobar' })}
                    className="flex items-center gap-2 px-4 py-2.5 mono text-xs font-bold transition-all"
                    style={{background:'#2ecc7120', color:'#2ecc71', border:'1px solid #2ecc7140'}}>
                    <CheckCircle size={13} /> DESPACHAR
                  </button>
                  <button onClick={() => setNotaModal({ ticket: t, action: 'rechazar' })}
                    className="flex items-center gap-2 px-4 py-2.5 mono text-xs font-bold transition-all"
                    style={{background:'#e74c3c20', color:'#e74c3c', border:'1px solid #e74c3c40'}}>
                    <XCircle size={13} /> RECHAZAR
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal nota */}
      {notaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.9)'}}>
          <div className="w-full max-w-sm card p-6">
            <div className="mb-4">
              <div className="display text-xl mb-1" style={{color: notaModal.action==='aprobar'?'#2ecc71':'#e74c3c'}}>
                {notaModal.action === 'aprobar' ? '✅ DESPACHAR TICKET' : '❌ RECHAZAR TICKET'}
              </div>
              <div className="mono text-xs" style={{color:'#555'}}>{notaModal.ticket.folio} — {notaModal.ticket.herramienta?.nombre}</div>
              <div className="mono text-xs" style={{color:'#555'}}>Cantidad: {notaModal.ticket.cantidad} {notaModal.ticket.herramienta?.unidad}</div>
            </div>
            <div className="mb-4">
              <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>
                NOTA PARA EL SOLICITANTE (opcional)
              </label>
              <textarea className="input-field h-20 resize-none" value={nota} onChange={e => setNota(e.target.value)}
                placeholder={notaModal.action === 'aprobar' ? 'Ej: Pasar al tool crib a recoger...' : 'Ej: No hay stock suficiente, vuelve el lunes...'} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setNotaModal(null); setNota('') }} className="btn-ghost flex-1 justify-center mono text-xs">
                CANCELAR
              </button>
              <button onClick={() => handleAction(notaModal.action)}
                className="flex-1 justify-center display tracking-widest py-2 px-4 text-sm"
                style={{background: notaModal.action==='aprobar'?'#2ecc71':'#e74c3c', color:'#000', fontWeight:'700'}}>
                {notaModal.action === 'aprobar' ? 'CONFIRMAR DESPACHO' : 'CONFIRMAR RECHAZO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
