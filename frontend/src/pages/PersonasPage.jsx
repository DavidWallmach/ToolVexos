import { useEffect, useState } from 'react'
import { Plus, Trash2, User, History } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function PersonasPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const [personas, setPersonas] = useState([])
  const [salidas, setSalidas] = useState([])
  const [modal, setModal] = useState(false)
  const [historialModal, setHistorialModal] = useState(null)
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
    } catch (err) { toast.error('Error al eliminar') }
  }

  const verHistorial = async (p) => {
    const { data } = await api.get('/salidas')
    const filtradas = data.salidas.filter(s => s.solicitante === p.nombre)
    setSalidas(filtradas)
    setHistorialModal(p)
  }

  const turnoColor = { Matutino:'#f5a623', Vespertino:'#3b82f6', Nocturno:'#8b5cf6' }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>PERSONAS</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>OPERADORES Y PERSONAL AUTORIZADO</div>
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
                    <div className="w-7 h-7 rounded-full flex items-center justify-center mono text-xs font-bold" style={{background:'#1a1a1a', color:'#f5a623', border:'1px solid #2a2a2a'}}>
                      {p.nombre[0]}
                    </div>
                    <span className="text-sm" style={{color:'#e8e8e8'}}>{p.nombre}</span>
                  </div>
                </td>
                <td className="td mono text-xs" style={{color:'#555'}}>{p.departamento || '—'}</td>
                <td className="td">
                  {p.turno ? (
                    <span className="mono text-xs font-semibold" style={{color: turnoColor[p.turno] || '#888'}}>{p.turno}</span>
                  ) : <span style={{color:'#333'}}>—</span>}
                </td>
                <td className="td mono text-xs" style={{color:'#888'}}>{p._count?.salidas || 0}</td>
                <td className="td">
                  <div className="flex gap-2">
                    <button onClick={() => verHistorial(p)} className="btn-ghost text-xs py-1 px-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.88)'}}>
          <div className="w-full max-w-lg card" style={{maxHeight:'80vh',overflowY:'auto'}}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'#1a1a1a'}}>
              <div>
                <div className="display text-xl" style={{color:'#f5a623'}}>HISTORIAL — {historialModal.nombre}</div>
                <div className="mono text-xs" style={{color:'#444'}}>{historialModal.empleado} · {historialModal.departamento}</div>
              </div>
              <button onClick={() => setHistorialModal(null)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <table className="w-full">
              <thead><tr>{['FECHA','MATERIAL','CANTIDAD','PROPÓSITO'].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {salidas.length === 0 ? (
                  <tr><td colSpan={4} className="td mono text-xs text-center" style={{color:'#333'}}>SIN SALIDAS REGISTRADAS</td></tr>
                ) : salidas.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="td mono text-xs" style={{color:'#555'}}>{new Date(s.createdAt).toLocaleDateString('es-MX')}</td>
                    <td className="td text-sm" style={{color:'#e8e8e8'}}>{s.herramienta?.nombre}</td>
                    <td className="td mono text-xs" style={{color:'#f5a623'}}>-{s.cantidad} {s.herramienta?.unidad}</td>
                    <td className="td text-xs" style={{color:'#555'}}>{s.proposito || '—'}</td>
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
