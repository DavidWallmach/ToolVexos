import { useEffect, useState } from 'react'
import { Plus, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function MantenimientoPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const [items, setItems] = useState([])
  const [herramientas, setHerramientas] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ herramientaId:'', tipo:'preventivo', descripcion:'', tecnico:'' })

  const load = async () => {
    const [m, h] = await Promise.all([api.get('/mantenimiento'), api.get('/herramientas')])
    setItems(m.data.mantenimientos)
    setHerramientas(h.data.herramientas)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    try {
      await api.post('/mantenimiento', form)
      toast.success('Mantenimiento registrado')
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const handleCompletar = async (id) => {
    try {
      await api.put(`/mantenimiento/${id}/completar`, {})
      toast.success('Mantenimiento completado')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const statusColor = { pendiente:'text-[#f5a623]', en_proceso:'text-blue-400', completado:'text-green-400' }
  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>MANTENIMIENTO</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>{items.filter(i=>i.status!=='completado').length} PENDIENTES</div>
        </div>
        {isAdmin && (
          <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm">
            <Plus size={14} /> REGISTRAR
          </button>
        )}
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['HERRAMIENTA','TIPO','DESCRIPCIÓN','TÉCNICO','FECHA','STATUS',''].map(h=><th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={7} className="td mono text-xs text-center" style={{color:'#333'}}>SIN REGISTROS</td></tr>
            : items.map(m => (
              <tr key={m.id} className="table-row">
                <td className="td">
                  <div className="text-sm" style={{color:'#e8e8e8'}}>{m.herramienta?.nombre}</div>
                  <div className="mono text-xs" style={{color:'#444'}}>{m.herramienta?.codigo}</div>
                </td>
                <td className="td mono text-xs" style={{color:'#888'}}>{m.tipo.toUpperCase()}</td>
                <td className="td text-sm" style={{color:'#888', maxWidth:'200px'}}>{m.descripcion}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{m.tecnico || '—'}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{new Date(m.fechaInicio).toLocaleDateString('es-MX')}</td>
                <td className="td mono text-xs font-semibold"><span className={statusColor[m.status]}>{m.status.toUpperCase()}</span></td>
                <td className="td">
                  {isAdmin && m.status !== 'completado' && (
                    <button onClick={() => handleCompletar(m.id)} className="btn-ghost text-xs py-1 px-2">
                      <CheckCircle size={11} /> COMPLETAR
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.85)'}}>
          <div className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="display text-xl" style={{color:'#f5a623'}}>NUEVO MANTENIMIENTO</div>
              <button onClick={() => setModal(false)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>HERRAMIENTA</label>
                <select className="input-field" value={form.herramientaId} onChange={e => set('herramientaId', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {herramientas.map(h => <option key={h.id} value={h.id}>{h.nombre} ({h.codigo})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>TIPO</label>
                  <select className="input-field" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                    <option value="preventivo">PREVENTIVO</option>
                    <option value="correctivo">CORRECTIVO</option>
                  </select>
                </div>
                <div>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>TÉCNICO</label>
                  <input className="input-field" value={form.tecnico} onChange={e => set('tecnico', e.target.value)} placeholder="Nombre..." />
                </div>
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>DESCRIPCIÓN</label>
                <textarea className="input-field h-20 resize-none" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Describe el trabajo..." />
              </div>
              <button onClick={handleCreate} className="btn-accent w-full justify-center display tracking-widest">REGISTRAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
