import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function SalidasPage() {
  const user = useAuthStore(s => s.user)
  const canCreate = ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const [salidas, setSalidas] = useState([])
  const [herramientas, setHerramientas] = useState([])
  const [personas, setPersonas] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ herramientaId:'', cantidad:'', solicitante:'', departamento:'', proposito:'' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [s, h, p] = await Promise.all([
      api.get('/salidas'),
      api.get('/herramientas', { params: { status: 'DISPONIBLE' } }),
      api.get('/personas')
    ])
    setSalidas(s.data.salidas)
    setHerramientas(h.data.herramientas)
    setPersonas(p.data.personas)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const handlePersonaSelect = (e) => {
    const p = personas.find(p => p.id === e.target.value)
    if (p) {
      setForm(f => ({...f, solicitante: p.nombre, departamento: p.departamento || ''}))
    }
  }

  const handleCreate = async () => {
    if (!form.herramientaId || !form.cantidad || !form.solicitante) return toast.error('Faltan campos obligatorios')
    try {
      await api.post('/salidas', form)
      toast.success('Salida registrada')
      setModal(false)
      setForm({ herramientaId:'', cantidad:'', solicitante:'', departamento:'', proposito:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>SALIDAS</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>REGISTRO DE MATERIAL ENTREGADO A PRODUCCIÓN</div>
        </div>
        {canCreate && (
          <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm">
            <Plus size={14} /> REGISTRAR SALIDA
          </button>
        )}
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['FECHA / HORA','MATERIAL','CANTIDAD','SOLICITÓ','DEPARTAMENTO','PROPÓSITO'].map(h=><th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="td mono text-xs text-center" style={{color:'#333'}}>CARGANDO...</td></tr>
            : salidas.length === 0 ? <tr><td colSpan={6} className="td mono text-xs text-center" style={{color:'#333'}}>SIN SALIDAS REGISTRADAS</td></tr>
            : salidas.map(s => (
              <tr key={s.id} className="table-row">
                <td className="td mono text-xs" style={{color:'#555'}}>
                  {new Date(s.createdAt).toLocaleDateString('es-MX')} {new Date(s.createdAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}
                </td>
                <td className="td">
                  <div className="text-sm" style={{color:'#e8e8e8'}}>{s.herramienta?.nombre}</div>
                  <div className="mono text-xs" style={{color:'#444'}}>{s.herramienta?.codigo}</div>
                </td>
                <td className="td">
                  <span className="mono text-sm font-semibold" style={{color:'#f5a623'}}>-{s.cantidad}</span>
                  <span className="mono text-xs ml-1" style={{color:'#444'}}>{s.herramienta?.unidad}</span>
                </td>
                <td className="td text-sm" style={{color:'#e8e8e8'}}>{s.solicitante}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{s.departamento || '—'}</td>
                <td className="td text-xs" style={{color:'#555'}}>{s.proposito || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.88)'}}>
          <div className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="display text-xl" style={{color:'#f5a623'}}>REGISTRAR SALIDA</div>
                <div className="mono text-xs" style={{color:'#444'}}>ENTREGA DE MATERIAL A PRODUCCIÓN</div>
              </div>
              <button onClick={() => setModal(false)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>MATERIAL *</label>
                <select className="input-field" value={form.herramientaId} onChange={e => set('herramientaId', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {herramientas.map(h => <option key={h.id} value={h.id}>{h.nombre} ({h.codigo}) — Disp: {h.stockDisp} {h.unidad}</option>)}
                </select>
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>PERSONA REGISTRADA (opcional)</label>
                <select className="input-field" onChange={handlePersonaSelect}>
                  <option value="">Seleccionar persona...</option>
                  {personas.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.empleado}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>SOLICITANTE *</label>
                  <input className="input-field" value={form.solicitante} onChange={e => set('solicitante', e.target.value)} placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>CANTIDAD *</label>
                  <input type="number" min="1" className="input-field mono" value={form.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>DEPARTAMENTO</label>
                <input className="input-field" value={form.departamento} onChange={e => set('departamento', e.target.value)} placeholder="Ej: Producción, Mantenimiento..." />
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>PROPÓSITO</label>
                <input className="input-field" value={form.proposito} onChange={e => set('proposito', e.target.value)} placeholder="¿Para qué se usa?" />
              </div>
              <button onClick={handleCreate} className="btn-accent w-full justify-center display tracking-widest">
                REGISTRAR SALIDA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
