import { useEffect, useState } from 'react'
import { Plus, RotateCcw, Clock } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import toast from 'react-hot-toast'

const statusBadge = {
  ACTIVO: <span className="badge" style={{background:'#3b82f620', color:'#3b82f6', border:'1px solid #3b82f630'}}>ACTIVO</span>,
  DEVUELTO: <span className="badge-ok">DEVUELTO</span>,
  VENCIDO: <span className="badge-danger">VENCIDO</span>,
  PERDIDO: <span className="badge-danger">PERDIDO</span>,
}

export default function PrestamosPage() {
  const user = useAuthStore(s => s.user)
  const canCreate = ['ADMIN','SUPERVISOR','JEFE_GRUPO'].includes(user?.role)
  const [prestamos, setPrestamos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [herramientas, setHerramientas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ userId:'', herramientaId:'', cantidad:1, motivo:'', fechaRetorno:'' })

  const load = async () => {
    setLoading(true)
    const [p, u, h] = await Promise.all([
      api.get('/prestamos'),
      api.get('/users'),
      api.get('/herramientas', { params: { status: 'DISPONIBLE' } })
    ])
    setPrestamos(p.data.prestamos)
    setUsuarios(u.data.users)
    setHerramientas(h.data.herramientas)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    try {
      await api.post('/prestamos', form)
      toast.success('Préstamo registrado')
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const handleDevolver = async (id, folio) => {
    if (!confirm(`¿Confirmar devolución del préstamo ${folio}?`)) return
    try {
      await api.post(`/prestamos/${id}/devolver`, {})
      toast.success('Devolución registrada')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>PRÉSTAMOS</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>{prestamos.filter(p=>p.status==='ACTIVO').length} ACTIVOS</div>
        </div>
        {canCreate && (
          <button onClick={() => setModal(true)} className="btn-accent display tracking-widest text-sm">
            <Plus size={14} /> NUEVO PRÉSTAMO
          </button>
        )}
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>
              {['FOLIO','HERRAMIENTA','SOLICITANTE','CANT.','SALIDA','RETORNO EST.','STATUS','ACCIÓN'].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="td mono text-xs text-center" style={{color:'#333'}}>CARGANDO...</td></tr>
            : prestamos.length === 0 ? <tr><td colSpan={8} className="td mono text-xs text-center" style={{color:'#333'}}>SIN PRÉSTAMOS</td></tr>
            : prestamos.map(p => (
              <tr key={p.id} className="table-row">
                <td className="td mono text-xs" style={{color:'#f5a623'}}>{p.folio}</td>
                <td className="td">
                  <div className="text-sm" style={{color:'#e8e8e8'}}>{p.herramienta?.nombre}</div>
                  <div className="mono text-xs" style={{color:'#444'}}>{p.herramienta?.codigo}</div>
                </td>
                <td className="td">
                  <div className="text-sm" style={{color:'#e8e8e8'}}>{p.user?.nombre}</div>
                  <div className="mono text-xs" style={{color:'#444'}}>{p.user?.empleado} · {p.user?.role}</div>
                </td>
                <td className="td mono text-xs" style={{color:'#888'}}>{p.cantidad} {p.herramienta?.unidad}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{new Date(p.fechaSalida).toLocaleDateString('es-MX')}</td>
                <td className="td mono text-xs" style={{color: p.fechaRetorno && new Date(p.fechaRetorno) < new Date() && p.status==='ACTIVO' ? '#e74c3c' : '#555'}}>
                  {p.fechaRetorno ? new Date(p.fechaRetorno).toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="td">{statusBadge[p.status]}</td>
                <td className="td">
                  {p.status === 'ACTIVO' && canCreate && (
                    <button onClick={() => handleDevolver(p.id, p.folio)} className="btn-ghost text-xs py-1 px-2">
                      <RotateCcw size={11} /> DEVOLVER
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo préstamo */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.85)'}}>
          <div className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="display text-xl" style={{color:'#f5a623'}}>NUEVO PRÉSTAMO</div>
              <button onClick={() => setModal(false)} className="btn-ghost p-2 text-xs mono">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>SOLICITANTE</label>
                <select className="input-field" value={form.userId} onChange={e => set('userId', e.target.value)}>
                  <option value="">Seleccionar empleado...</option>
                  {usuarios.filter(u => ['SUPERVISOR','JEFE_GRUPO','ADMIN'].includes(u.role)).map(u => (
                    <option key={u.id} value={u.id}>{u.nombre} — {u.empleado} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>HERRAMIENTA / MATERIAL</label>
                <select className="input-field" value={form.herramientaId} onChange={e => set('herramientaId', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {herramientas.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre} ({h.codigo}) — Disp: {h.stockDisp}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>CANTIDAD</label>
                  <input type="number" className="input-field mono" value={form.cantidad} min={1} onChange={e => set('cantidad', e.target.value)} />
                </div>
                <div>
                  <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>RETORNO ESPERADO</label>
                  <input type="date" className="input-field mono" value={form.fechaRetorno} onChange={e => set('fechaRetorno', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>MOTIVO</label>
                <input className="input-field" value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Motivo del préstamo..." />
              </div>
              <button onClick={handleCreate} className="btn-accent w-full justify-center display tracking-widest">
                REGISTRAR PRÉSTAMO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
