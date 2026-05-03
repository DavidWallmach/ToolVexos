import { useEffect, useState } from 'react'
import { Plus, MapPin, Trash2 } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function UbicacionesPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const [ubicaciones, setUbicaciones] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre:'', zona:'', descripcion:'' })

  const load = () => api.get('/ubicaciones').then(r => setUbicaciones(r.data.ubicaciones))
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const handleCreate = async () => {
    if (!form.nombre) return toast.error('El nombre es obligatorio')
    try {
      await api.post('/ubicaciones', form)
      toast.success('Ubicación creada')
      setModal(false)
      setForm({ nombre:'', zona:'', descripcion:'' })
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar ubicación "${nombre}"?`)) return
    try {
      await api.delete(`/ubicaciones/${id}`)
      toast.success('Eliminada')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>UBICACIONES</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>ESTANTES, CAJONES Y ZONAS DEL ALMACÉN</div>
        </div>
        {isAdmin && (
          <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm">
            <Plus size={14} /> NUEVA UBICACIÓN
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ubicaciones.length === 0 && (
          <div className="card p-6 col-span-3 text-center">
            <div className="mono text-xs" style={{color:'#333'}}>SIN UBICACIONES REGISTRADAS</div>
          </div>
        )}
        {ubicaciones.map(u => (
          <div key={u.id} className="card p-5" style={{borderLeft:'2px solid #f5a623'}}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} style={{color:'#f5a623'}} />
                <div className="display text-lg" style={{color:'#f5a623'}}>{u.nombre}</div>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(u.id, u.nombre)} className="btn-ghost p-1.5">
                  <Trash2 size={12} style={{color:'#e74c3c'}} />
                </button>
              )}
            </div>
            {u.zona && <div className="mono text-xs mb-1" style={{color:'#555'}}>📍 {u.zona}</div>}
            {u.descripcion && <div className="text-xs mb-3" style={{color:'#444'}}>{u.descripcion}</div>}
            <div className="mono text-xs pt-3 border-t" style={{color:'#555', borderColor:'#1a1a1a'}}>
              {u._count?.herramientas || 0} {u._count?.herramientas === 1 ? 'material asignado' : 'materiales asignados'}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.88)'}}>
          <div className="w-full max-w-sm card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="display text-xl" style={{color:'#f5a623'}}>NUEVA UBICACIÓN</div>
              <button onClick={() => setModal(false)} className="btn-ghost p-2 text-xs">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>NOMBRE *</label>
                <input className="input-field" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Estante A, Cajón 3..." />
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>ZONA</label>
                <input className="input-field" value={form.zona} onChange={e => set('zona', e.target.value)} placeholder="Ej: Zona 1, Área de herramientas..." />
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555',fontSize:'10px'}}>DESCRIPCIÓN</label>
                <input className="input-field" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="¿Qué se guarda aquí?" />
              </div>
              <button onClick={handleCreate} className="btn-accent w-full justify-center display tracking-widest">CREAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
