import { useEffect, useState } from 'react'
import { Plus, Clock, CheckCircle, XCircle, Package, History } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import toast from 'react-hot-toast'

const statusIcon = {
  PENDIENTE: <Clock size={13} style={{color:'#f5a623'}} />,
  PARCIAL: <Clock size={13} style={{color:'#3b82f6'}} />,
  DESPACHADO: <CheckCircle size={13} style={{color:'#2ecc71'}} />,
  RECHAZADO: <XCircle size={13} style={{color:'#e74c3c'}} />,
}
const statusColor = { PENDIENTE:'#f5a623', PARCIAL:'#3b82f6', DESPACHADO:'#2ecc71', RECHAZADO:'#e74c3c' }

export default function MisTicketsPage() {
  const user = useAuthStore(s => s.user)
  const [tickets, setTickets] = useState([])
  const [herramientas, setHerramientas] = useState([])
  const [personas, setPersonas] = useState([])
  const [modal, setModal] = useState(false)
  const [historialModal, setHistorialModal] = useState(null)
  const [historialTickets, setHistorialTickets] = useState([])
  const [form, setForm] = useState({ herramientaId:'', cantidad:'', motivo:'', personaId:'', operadorNombre:'' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [t, h, p] = await Promise.all([
      api.get('/tickets'),
      api.get('/herramientas'),
      api.get('/personas')
    ])
    setTickets(t.data.tickets)
    setHerramientas(h.data.herramientas.filter(h => h.stockDisp > 0 && h.status === 'DISPONIBLE'))
    setPersonas(p.data.personas)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const handlePersonaSelect = (e) => {
    const p = personas.find(p => p.id === e.target.value)
    setForm(f => ({...f, personaId: e.target.value, operadorNombre: p ? p.nombre : ''}))
  }

  const handleCreate = async () => {
    if (!form.herramientaId || !form.cantidad || !form.motivo || !form.operadorNombre)
      return toast.error('Todos los campos son obligatorios')
    try {
      await api.post('/tickets', {
        herramientaId: form.herramientaId,
        cantidad: form.cantidad,
        motivo: `${form.motivo} | Operador: ${form.operadorNombre}`,
      })
      toast.success('Ticket enviado — el encargado lo revisará')
      setModal(false)
      setForm({ herramientaId:'', cantidad:'', motivo:'', personaId:'', operadorNombre:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear ticket') }
  }

  const verHistorial = async (persona) => {
    const { data } = await api.get('/tickets')
    const filtrados = data.tickets.filter(t =>
      t.motivo.includes(`Operador: ${persona.nombre}`)
    )
    setHistorialTickets(filtrados)
    setHistorialModal(persona)
  }

  const pending = tickets.filter(t => t.status === 'PENDIENTE').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>MIS TICKETS</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>
            {pending > 0 ? `${pending} TICKET(S) PENDIENTE(S) DE APROBACIÓN` : 'SOLICITUDES DE MATERIAL'}
          </div>
        </div>
        <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm">
          <Plus size={14} /> SOLICITAR MATERIAL
        </button>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {loading ? <div className="mono text-xs" style={{color:'#333'}}>CARGANDO...</div>
        : tickets.length === 0 ? (
          <div className="card p-10 text-center">
            <Package size={32} style={{color:'#2a2a2a', margin:'0 auto 12px'}} />
            <div className="mono text-xs" style={{color:'#333'}}>AÚN NO HAS HECHO NINGUNA SOLICITUD</div>
            <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm mt-4 mx-auto">
              + SOLICITAR MATERIAL
            </button>
          </div>
        ) : tickets.map(t => (
          <div key={t.id} className="card p-5" style={{borderLeft:`2px solid ${statusColor[t.status]}`}}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {statusIcon[t.status]}
                  <span className="mono text-xs font-bold" style={{color: statusColor[t.status]}}>{t.status}</span>
                  <span className="mono text-xs" style={{color:'#444'}}>·</span>
                  <span className="mono text-xs" style={{color:'#f5a623'}}>{t.folio}</span>
                </div>
                <div className="text-base font-medium mb-1" style={{color:'#e8e8e8'}}>{t.herramienta?.nombre}</div>
                <div className="mono text-xs mb-2" style={{color:'#555'}}>{t.herramienta?.codigo} · {t.cantidad} {t.herramienta?.unidad}</div>
                <div>
                  <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>MOTIVO</div>
                  <div className="text-sm" style={{color:'#888'}}>
                    {t.motivo.includes('| Operador:') ? t.motivo.split('| Operador:')[0].trim() : t.motivo}
                  </div>
                  {t.motivo.includes('| Operador:') && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="mono text-xs px-2 py-1 inline-block"
                        style={{background:'#f5a62315', color:'#f5a623', border:'1px solid #f5a62330'}}>
                        👷 {t.motivo.split('| Operador:')[1].trim()}
                      </div>
                      <button
                        onClick={() => {
                          const nombre = t.motivo.split('| Operador:')[1].trim()
                          const persona = personas.find(p => p.nombre === nombre)
                          if (persona) verHistorial(persona)
                          else toast.error('Operador no registrado en Personas')
                        }}
                        className="mono text-xs flex items-center gap-1 px-2 py-1"
                        style={{color:'#555', border:'1px solid #2a2a2a'}}
                      >
                        <History size={11} /> HISTORIAL
                      </button>
                    </div>
                  )}
                </div>
                {t.nota && (
                  <div className="mt-2 px-3 py-2 border-l-2" style={{borderColor: statusColor[t.status], background:'#1a1a1a'}}>
                    <div className="mono text-xs mb-0.5" style={{color:'#555'}}>NOTA DEL ENCARGADO:</div>
                    <div className="text-xs" style={{color:'#888'}}>{t.nota}</div>
                  </div>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="mono text-xs" style={{color:'#444'}}>{new Date(t.createdAt).toLocaleDateString('es-MX')}</div>
                <div className="mono text-xs" style={{color:'#333'}}>{new Date(t.createdAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal nueva solicitud */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.9)'}}>
          <div className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="display text-xl" style={{color:'#f5a623'}}>SOLICITAR MATERIAL</div>
                <div className="mono text-xs" style={{color:'#444'}}>EL ENCARGADO APROBARÁ TU SOLICITUD</div>
              </div>
              <button onClick={() => setModal(false)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>MATERIAL *</label>
                <select className="input-field" value={form.herramientaId} onChange={e => set('herramientaId', e.target.value)}>
                  <option value="">Seleccionar material...</option>
                  {herramientas.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre} ({h.codigo}) — Disp: {h.stockDisp} {h.unidad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>CANTIDAD *</label>
                <input type="number" min="1" className="input-field mono" value={form.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>MOTIVO / JUSTIFICACIÓN *</label>
                <textarea className="input-field h-20 resize-none" value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="¿Para qué necesitas este material? ¿Orden de trabajo?" />
              </div>

              {/* Operador */}
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>OPERADOR QUE SOLICITA *</label>
                {personas.length > 0 ? (
                  <select className="input-field" value={form.personaId} onChange={handlePersonaSelect}>
                    <option value="">Seleccionar operador registrado...</option>
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} — {p.empleado} {p.departamento ? `(${p.departamento})` : ''}</option>
                    ))}
                  </select>
                ) : null}
                <input
                  className="input-field mt-2"
                  value={form.operadorNombre}
                  onChange={e => setForm(f => ({...f, operadorNombre: e.target.value, personaId:''}))}
                  placeholder="O escribe el nombre manualmente..."
                />
              </div>

              <div className="px-3 py-2 border" style={{borderColor:'#2a2a2a', background:'#111'}}>
                <div className="mono text-xs" style={{color:'#444'}}>
                  👤 Supervisor: <span style={{color:'#888'}}>{user?.nombre} ({user?.empleado})</span>
                </div>
              </div>

              <button onClick={handleCreate} className="btn-accent w-full justify-center display tracking-widest">
                ENVIAR SOLICITUD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historial operador */}
      {historialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.9)'}}>
          <div className="w-full max-w-lg card" style={{maxHeight:'80vh', overflowY:'auto'}}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'#1a1a1a'}}>
              <div>
                <div className="display text-xl" style={{color:'#f5a623'}}>HISTORIAL — {historialModal.nombre}</div>
                <div className="mono text-xs" style={{color:'#444'}}>{historialModal.empleado} · {historialModal.departamento || 'Sin departamento'}</div>
              </div>
              <button onClick={() => setHistorialModal(null)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <table className="w-full">
              <thead><tr>{['FOLIO','MATERIAL','CANT.','FECHA','STATUS'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {historialTickets.length === 0 ? (
                  <tr><td colSpan={5} className="td mono text-xs text-center" style={{color:'#333'}}>SIN SOLICITUDES REGISTRADAS</td></tr>
                ) : historialTickets.map(t => (
                  <tr key={t.id} className="table-row">
                    <td className="td mono text-xs" style={{color:'#f5a623'}}>{t.folio}</td>
                    <td className="td text-sm" style={{color:'#e8e8e8'}}>{t.herramienta?.nombre}</td>
                    <td className="td mono text-xs" style={{color:'#888'}}>{t.cantidad} {t.herramienta?.unidad}</td>
                    <td className="td mono text-xs" style={{color:'#555'}}>{new Date(t.createdAt).toLocaleDateString('es-MX')}</td>
                    <td className="td mono text-xs font-bold" style={{color: statusColor[t.status]}}>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
