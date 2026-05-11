import { useEffect, useState } from 'react'
import { Plus, Trash2, History, X, Package } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function PersonasPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const [personas, setPersonas] = useState([])
  const [modal, setModal] = useState(false)
  const [historialModal, setHistorialModal] = useState(null)
  const [historial, setHistorial] = useState([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [form, setForm] = useState({ nombre:'', empleado:'', departamento:'', turno:'' })

  const load = () => api.get('/personas').then(r => setPersonas(r.data.personas))
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const handleCreate = async () => {
    if (!form.nombre || !form.empleado) return toast.error('Nombre y número de empleado son obligatorios')
    try {
      await api.post('/personas', form)
      toast.success('Persona registrada')
      setModal(false)
      setForm({ nombre:'', empleado:'', departamento:'', turno:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar a "${nombre}"?`)) return
    try {
      await api.delete(`/personas/${id}`)
      toast.success('Eliminada')
      load()
    } catch { toast.error('Error al eliminar') }
  }

  const verHistorial = async (p) => {
    setHistorialModal(p)
    setHistorialLoading(true)
    try {
      // Buscar tickets despachados donde el motivo contiene el nombre del operador
      const { data: ticketsData } = await api.get('/tickets')
      const { data: salidasData } = await api.get('/salidas')

      // Filtrar tickets donde el operador coincide
      const ticketsFiltrados = ticketsData.tickets.filter(t => {
        const operador = t.motivo.includes('| Operador:')
          ? t.motivo.split('| Operador:')[1].trim()
          : ''
        return operador.toLowerCase() === p.nombre.toLowerCase() && 
               ['DESPACHADO','PARCIAL'].includes(t.status)
      })

      // Filtrar salidas directas por nombre
      const salidasFiltradas = salidasData.salidas.filter(s =>
        s.solicitante.toLowerCase() === p.nombre.toLowerCase()
      )

      setHistorial({ tickets: ticketsFiltrados, salidas: salidasFiltradas })
    } catch {
      setHistorial({ tickets: [], salidas: [] })
    }
    setHistorialLoading(false)
  }

  const turnoColor = { Matutino:'#f5a623', Vespertino:'#3b82f6', Nocturno:'#8b5cf6' }

  // Calcular stats de persona
  const getStats = (p) => {
    return p._count?.salidas || 0
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>PERSONAS</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>OPERADORES Y PERSONAL AUTORIZADO — {personas.length} REGISTRADOS</div>
        </div>
        {isAdmin && (
          <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm">
            <Plus size={14} /> REGISTRAR PERSONA
          </button>
        )}
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['EMPLEADO','NOMBRE','DEPARTAMENTO','TURNO','SALIDAS',''].map(h=><th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {personas.length === 0 ? (
              <tr><td colSpan={6} className="td mono text-xs text-center" style={{color:'#333'}}>SIN PERSONAS REGISTRADAS</td></tr>
            ) : personas.map(p => (
              <tr key={p.id} className="table-row">
                <td className="td mono text-xs" style={{color:'#f5a623'}}>{p.empleado}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mono text-sm font-bold flex-shrink-0"
                      style={{background:'#1a1a1a', color:'#f5a623', border:'1px solid #2a2a2a'}}>
                      {p.nombre[0].toUpperCase()}
                    </div>
                    <span className="text-sm" style={{color:'#e8e8e8'}}>{p.nombre}</span>
                  </div>
                </td>
                <td className="td mono text-xs" style={{color:'#555'}}>{p.departamento || '—'}</td>
                <td className="td">
                  {p.turno
                    ? <span className="mono text-xs font-semibold" style={{color: turnoColor[p.turno] || '#888'}}>{p.turno}</span>
                    : <span style={{color:'#333'}}>—</span>}
                </td>
                <td className="td">
                  <span className="mono text-sm font-bold" style={{color:'#f5a623'}}>{p._count?.salidas || 0}</span>
                  <span className="mono text-xs ml-1" style={{color:'#444'}}>salidas</span>
                </td>
                <td className="td">
                  <div className="flex gap-2">
                    <button onClick={() => verHistorial(p)} className="btn-ghost text-xs py-1 px-3">
                      <History size={11} /> HISTORIAL
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(p.id, p.nombre)} className="btn-danger text-xs py-1 px-2">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.88)'}}>
          <div className="w-full max-w-sm card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="display text-xl" style={{color:'#f5a623'}}>REGISTRAR PERSONA</div>
              <button onClick={() => setModal(false)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <div className="space-y-4">
              {[['NOMBRE COMPLETO *','nombre','Juan Pérez'],['N° EMPLEADO *','empleado','EMP-001'],['DEPARTAMENTO','departamento','Producción, Mantenimiento...']].map(([label,key,ph]) => (
                <div key={key}>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>{label}</label>
                  <input className="input-field" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>TURNO</label>
                <select className="input-field" value={form.turno} onChange={e => set('turno', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Nocturno">Nocturno</option>
                </select>
              </div>
              <button onClick={handleCreate} className="btn-accent w-full justify-center display tracking-widest">REGISTRAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal historial */}
      {historialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.92)'}}>
          <div className="w-full max-w-2xl card" style={{maxHeight:'85vh', display:'flex', flexDirection:'column'}}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{borderColor:'#1a1a1a'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mono text-lg font-bold"
                  style={{background:'#f5a62320', color:'#f5a623', border:'1px solid #f5a62340'}}>
                  {historialModal.nombre[0].toUpperCase()}
                </div>
                <div>
                  <div className="display text-xl" style={{color:'#f5a623'}}>{historialModal.nombre}</div>
                  <div className="mono text-xs" style={{color:'#444'}}>
                    {historialModal.empleado}
                    {historialModal.departamento ? ` · ${historialModal.departamento}` : ''}
                    {historialModal.turno ? ` · ${historialModal.turno}` : ''}
                  </div>
                </div>
              </div>
              <button onClick={() => setHistorialModal(null)} className="btn-ghost p-2">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {historialLoading ? (
                <div className="mono text-xs text-center py-8" style={{color:'#333'}}>CARGANDO HISTORIAL...</div>
              ) : (
                <>
                  {/* Stats resumen */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-4 text-center" style={{background:'#111', border:'1px solid #1a1a1a', borderLeft:'2px solid #f5a623'}}>
                      <div className="display text-3xl" style={{color:'#f5a623'}}>
                        {historial.tickets?.length || 0}
                      </div>
                      <div className="mono text-xs mt-1" style={{color:'#555', fontSize:'10px'}}>TICKETS VÍA SISTEMA</div>
                    </div>
                    <div className="p-4 text-center" style={{background:'#111', border:'1px solid #1a1a1a', borderLeft:'2px solid #3b82f6'}}>
                      <div className="display text-3xl" style={{color:'#3b82f6'}}>
                        {historial.salidas?.length || 0}
                      </div>
                      <div className="mono text-xs mt-1" style={{color:'#555', fontSize:'10px'}}>SALIDAS DIRECTAS</div>
                    </div>
                    <div className="p-4 text-center" style={{background:'#111', border:'1px solid #1a1a1a', borderLeft:'2px solid #2ecc71'}}>
                      <div className="display text-3xl" style={{color:'#2ecc71'}}>
                        {(historial.tickets?.length || 0) + (historial.salidas?.length || 0)}
                      </div>
                      <div className="mono text-xs mt-1" style={{color:'#555', fontSize:'10px'}}>TOTAL SOLICITUDES</div>
                    </div>
                  </div>

                  {/* Tickets via sistema */}
                  {historial.tickets?.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{background:'#f5a623'}} />
                        <span className="mono text-xs font-semibold tracking-widest" style={{color:'#f5a623'}}>
                          TICKETS VÍA SISTEMA ({historial.tickets.length})
                        </span>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr>
                            {['FOLIO','FECHA','MATERIAL','SOLICITADO','DESPACHADO','STATUS'].map(h=>(
                              <th key={h} className="th">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {historial.tickets.map(t => (
                            <tr key={t.id} className="table-row">
                              <td className="td mono text-xs" style={{color:'#f5a623'}}>{t.folio}</td>
                              <td className="td mono text-xs" style={{color:'#555'}}>
                                {new Date(t.createdAt).toLocaleDateString('es-MX')}
                              </td>
                              <td className="td">
                                <div className="text-sm" style={{color:'#e8e8e8'}}>{t.herramienta?.nombre}</div>
                                <div className="mono text-xs" style={{color:'#444'}}>{t.herramienta?.codigo}</div>
                              </td>
                              <td className="td mono text-xs" style={{color:'#888'}}>
                                {t.cantidad} {t.herramienta?.unidad}
                              </td>
                              <td className="td mono text-xs font-bold" style={{color:'#2ecc71'}}>
                                {t.cantidadDespachada || 0} {t.herramienta?.unidad}
                              </td>
                              <td className="td">
                                <span className="mono text-xs font-bold" style={{
                                  color: t.status === 'DESPACHADO' ? '#2ecc71' : '#3b82f6'
                                }}>{t.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Salidas directas */}
                  {historial.salidas?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{background:'#3b82f6'}} />
                        <span className="mono text-xs font-semibold tracking-widest" style={{color:'#3b82f6'}}>
                          SALIDAS DIRECTAS ({historial.salidas.length})
                        </span>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr>{['FECHA','MATERIAL','CANTIDAD','PROPÓSITO'].map(h=><th key={h} className="th">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {historial.salidas.map(s => (
                            <tr key={s.id} className="table-row">
                              <td className="td mono text-xs" style={{color:'#555'}}>
                                {new Date(s.createdAt).toLocaleDateString('es-MX')}
                              </td>
                              <td className="td">
                                <div className="text-sm" style={{color:'#e8e8e8'}}>{s.herramienta?.nombre}</div>
                                <div className="mono text-xs" style={{color:'#444'}}>{s.herramienta?.codigo}</div>
                              </td>
                              <td className="td mono text-xs font-bold" style={{color:'#f5a623'}}>
                                {s.cantidad} {s.herramienta?.unidad}
                              </td>
                              <td className="td text-xs" style={{color:'#555'}}>{s.proposito || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Sin historial */}
                  {!historial.tickets?.length && !historial.salidas?.length && (
                    <div className="text-center py-10">
                      <Package size={32} style={{color:'#2a2a2a', margin:'0 auto 12px'}} />
                      <div className="mono text-xs" style={{color:'#333'}}>
                        SIN HISTORIAL DE SOLICITUDES REGISTRADO
                      </div>
                      <div className="mono text-xs mt-1" style={{color:'#222'}}>
                        El historial aparece cuando se despachan tickets con este operador
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
