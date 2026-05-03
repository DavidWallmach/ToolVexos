import { useEffect, useState } from 'react'
import { Plus, PackagePlus } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function EntradasPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const [entradas, setEntradas] = useState([])
  const [herramientas, setHerramientas] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ herramientaId:'', cantidad:'', proveedor:'', recibio:'', notas:'' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [e, h] = await Promise.all([api.get('/entradas'), api.get('/herramientas')])
    setEntradas(e.data.entradas)
    setHerramientas(h.data.herramientas)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const handleCreate = async () => {
    if (!form.herramientaId || !form.cantidad) return toast.error('Herramienta y cantidad son obligatorios')
    try {
      await api.post('/entradas', form)
      toast.success('Entrada registrada')
      setModal(false)
      setForm({ herramientaId:'', cantidad:'', proveedor:'', recibio:'', notas:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>ENTRADAS</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>REGISTRO DE MATERIAL INGRESADO AL ALMACÉN</div>
        </div>
        {isAdmin && (
          <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm">
            <Plus size={14} /> REGISTRAR ENTRADA
          </button>
        )}
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['FECHA / HORA','MATERIAL','CANTIDAD','PROVEEDOR','RECIBIÓ','NOTAS'].map(h=><th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="td mono text-xs text-center" style={{color:'#333'}}>CARGANDO...</td></tr>
            : entradas.length === 0 ? <tr><td colSpan={6} className="td mono text-xs text-center" style={{color:'#333'}}>SIN ENTRADAS REGISTRADAS</td></tr>
            : entradas.map(e => (
              <tr key={e.id} className="table-row">
                <td className="td mono text-xs" style={{color:'#555'}}>
                  {new Date(e.createdAt).toLocaleDateString('es-MX')} {new Date(e.createdAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}
                </td>
                <td className="td">
                  <div className="text-sm" style={{color:'#e8e8e8'}}>{e.herramienta?.nombre}</div>
                  <div className="mono text-xs" style={{color:'#444'}}>{e.herramienta?.codigo}</div>
                </td>
                <td className="td">
                  <span className="mono text-sm font-semibold" style={{color:'#2ecc71'}}>+{e.cantidad}</span>
                  <span className="mono text-xs ml-1" style={{color:'#444'}}>{e.herramienta?.unidad}</span>
                </td>
                <td className="td mono text-xs" style={{color:'#888'}}>{e.proveedor || '—'}</td>
                <td className="td mono text-xs" style={{color:'#888'}}>{e.recibio || '—'}</td>
                <td className="td text-xs" style={{color:'#555'}}>{e.notas || '—'}</td>
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
                <div className="display text-xl" style={{color:'#2ecc71'}}>REGISTRAR ENTRADA</div>
                <div className="mono text-xs" style={{color:'#444'}}>INGRESO DE MATERIAL AL ALMACÉN</div>
              </div>
              <button onClick={() => setModal(false)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>MATERIAL *</label>
                <select className="input-field" value={form.herramientaId} onChange={e => set('herramientaId', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {herramientas.map(h => <option key={h.id} value={h.id}>{h.nombre} ({h.codigo}) — Stock: {h.stockDisp}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>CANTIDAD *</label>
                  <input type="number" min="1" className="input-field mono" value={form.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>PROVEEDOR</label>
                  <input className="input-field" value={form.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Ej: HISCO" />
                </div>
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>RECIBIÓ</label>
                <input className="input-field" value={form.recibio} onChange={e => set('recibio', e.target.value)} placeholder="Nombre de quien recibió" />
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>NOTAS</label>
                <input className="input-field" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones opcionales..." />
              </div>
              <button onClick={handleCreate} className="btn-accent w-full justify-center display tracking-widest" style={{background:'#2ecc71', color:'#000'}}>
                REGISTRAR ENTRADA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
