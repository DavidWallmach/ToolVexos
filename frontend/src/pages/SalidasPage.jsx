import { useState } from 'react'
import { Plus, PackageMinus } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import useCarga from '../hooks/useCarga'
import { coincide, fechaHora } from '../lib/format'
import toast from 'react-hot-toast'
import { Buscador, Campo, Cargando, ErrorCarga, EstadoVacio, Modal, PageHeader } from '../components/ui'

const FORM_VACIO = { herramientaId: '', cantidad: '', solicitante: '', departamento: '', proposito: '' }

export default function SalidasPage() {
  const user = useAuthStore(s => s.user)
  const canCreate = ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const [salidas, setSalidas] = useState([])
  const [herramientas, setHerramientas] = useState([])
  const [personas, setPersonas] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [busqueda, setBusqueda] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { loading, fallo, recargar } = useCarga(async () => {
    const [s, h, p] = await Promise.all([
      api.get('/salidas'),
      api.get('/herramientas', { params: { status: 'DISPONIBLE' } }),
      api.get('/personas'),
    ])
    return () => {
      setSalidas(s.data.salidas)
      setHerramientas(h.data.herramientas)
      setPersonas(p.data.personas)
    }
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePersonaSelect = (e) => {
    const p = personas.find(p => p.id === e.target.value)
    if (p) setForm(f => ({ ...f, solicitante: p.nombre, departamento: p.departamento || '' }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post('/salidas', form)
      toast.success('Salida registrada')
      setModal(false)
      setForm(FORM_VACIO)
      recargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo registrar la salida')
    } finally { setEnviando(false) }
  }

  const visibles = salidas.filter(s => coincide(busqueda, s.herramienta?.nombre, s.herramienta?.codigo, s.solicitante, s.departamento, s.proposito))
  const seleccionada = herramientas.find(h => h.id === form.herramientaId)

  return (
    <div className="page-padding">
      <PageHeader titulo="Salidas" subtitulo="Material entregado a producción">
        {canCreate && <button onClick={() => setModal(true)} className="btn-accent"><Plus size={16} /> Registrar salida</button>}
      </PageHeader>

      {fallo ? <ErrorCarga que="las salidas" onReintentar={recargar} />
      : loading ? <Cargando texto="Cargando salidas..." />
      : salidas.length === 0 ? (
        <EstadoVacio icono={PackageMinus} titulo="Todavía no hay salidas" detalle="Registra la primera entrega de material."
          accion={canCreate ? 'Registrar salida' : undefined} onAccion={() => setModal(true)} />
      ) : (
        <>
          <div className="flex mb-4">
            <Buscador valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por material, solicitante o departamento..." />
          </div>

          {visibles.length === 0 ? <EstadoVacio titulo="Ninguna salida coincide con tu búsqueda" /> : (
            <>
              <div className="card hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr>{['Fecha', 'Material', 'Cantidad', 'Solicitó', 'Departamento', 'Propósito'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {visibles.map(s => (
                      <tr key={s.id} className="table-row">
                        <td className="td whitespace-nowrap">{fechaHora(s.createdAt)}</td>
                        <td className="td">
                          <div className="font-medium" style={{ color: 'var(--text)' }}>{s.herramienta?.nombre}</div>
                          <div className="mono text-xs" style={{ color: 'var(--accent)' }}>{s.herramienta?.codigo}</div>
                        </td>
                        <td className="td whitespace-nowrap"><b className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>−{s.cantidad}</b> {s.herramienta?.unidad}</td>
                        <td className="td" style={{ color: 'var(--text)' }}>{s.solicitante}</td>
                        <td className="td">{s.departamento || '—'}</td>
                        <td className="td">{s.proposito || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="md:hidden space-y-3">
                {visibles.map(s => (
                  <li key={s.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium" style={{ color: 'var(--text)' }}>{s.herramienta?.nombre}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{fechaHora(s.createdAt)}</div>
                      </div>
                      <span className="whitespace-nowrap text-sm" style={{ color: 'var(--text-2)' }}><b className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>−{s.cantidad}</b> {s.herramienta?.unidad}</span>
                    </div>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{[s.solicitante, s.departamento, s.proposito].filter(Boolean).join(' · ')}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {modal && (
        <Modal titulo="Registrar salida" subtitulo="Entrega de material a producción" onCerrar={() => setModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Campo etiqueta="Material" ayuda={seleccionada ? `${seleccionada.stockDisp} ${seleccionada.unidad} disponibles` : undefined}>
              <select className="input-field" required value={form.herramientaId} onChange={e => set('herramientaId', e.target.value)}>
                <option value="">Selecciona un material</option>
                {herramientas.filter(h => h.stockDisp > 0).map(h => <option key={h.id} value={h.id}>{h.nombre} ({h.codigo}) · {h.stockDisp} {h.unidad}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Persona registrada (opcional)" ayuda="Llena el nombre y el departamento por ti.">
              <select className="input-field" onChange={handlePersonaSelect} defaultValue="">
                <option value="">Selecciona una persona</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.nombre} · {p.empleado}</option>)}
              </select>
            </Campo>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Campo etiqueta="Solicitante"><input className="input-field" required value={form.solicitante} onChange={e => set('solicitante', e.target.value)} placeholder="Nombre completo" /></Campo>
              </div>
              <Campo etiqueta="Cantidad"><input type="number" min="1" max={seleccionada?.stockDisp} required className="input-field mono" value={form.cantidad} onChange={e => set('cantidad', e.target.value)} /></Campo>
            </div>
            <Campo etiqueta="Departamento"><input className="input-field" value={form.departamento} onChange={e => set('departamento', e.target.value)} placeholder="Producción" /></Campo>
            <Campo etiqueta="Propósito"><input className="input-field" value={form.proposito} onChange={e => set('proposito', e.target.value)} placeholder="¿Para qué se usará?" /></Campo>
            <button type="submit" disabled={enviando} className="btn-accent w-full justify-center disabled:opacity-60">{enviando ? 'Registrando...' : 'Registrar salida'}</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
