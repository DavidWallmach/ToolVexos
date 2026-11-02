import { useState } from 'react'
import { Plus, PackagePlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import useCarga from '../hooks/useCarga'
import { coincide, fechaHora } from '../lib/format'
import toast from 'react-hot-toast'
import { Buscador, Campo, Cargando, ErrorCarga, EstadoVacio, Modal, PageHeader } from '../components/ui'

const FORM_VACIO = { herramientaId: '', cantidad: '', proveedor: '', recibio: '', notas: '' }

export default function EntradasPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const [entradas, setEntradas] = useState([])
  const [herramientas, setHerramientas] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [busqueda, setBusqueda] = useState('')
  const [enviando, setEnviando] = useState(false)

  const { loading, fallo, recargar } = useCarga(async () => {
    const [e, h] = await Promise.all([api.get('/entradas'), api.get('/herramientas')])
    return () => {
      setEntradas(e.data.entradas)
      setHerramientas(h.data.herramientas)
    }
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post('/entradas', form)
      toast.success('Entrada registrada')
      setModal(false)
      setForm(FORM_VACIO)
      recargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo registrar la entrada')
    } finally { setEnviando(false) }
  }

  const visibles = entradas.filter(e => coincide(busqueda, e.herramienta?.nombre, e.herramienta?.codigo, e.proveedor, e.recibio, e.notas))

  return (
    <div className="page-padding">
      <PageHeader titulo="Entradas" subtitulo="Material ingresado al almacén">
        {isAdmin && <button onClick={() => setModal(true)} className="btn-accent"><Plus size={16} /> Registrar entrada</button>}
      </PageHeader>

      {fallo ? <ErrorCarga que="las entradas" onReintentar={recargar} />
      : loading ? <Cargando texto="Cargando entradas..." />
      : entradas.length === 0 ? (
        <EstadoVacio icono={PackagePlus} titulo="Todavía no hay entradas" detalle="Registra el primer ingreso de material."
          accion={isAdmin ? 'Registrar entrada' : undefined} onAccion={() => setModal(true)} />
      ) : (
        <>
          <div className="flex mb-4">
            <Buscador valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por material, proveedor o quien recibió..." />
          </div>

          {visibles.length === 0 ? <EstadoVacio titulo="Ninguna entrada coincide con tu búsqueda" /> : (
            <>
              <div className="card hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr>{['Fecha', 'Material', 'Cantidad', 'Proveedor', 'Recibió', 'Notas'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {visibles.map(e => (
                      <tr key={e.id} className="table-row">
                        <td className="td whitespace-nowrap">{fechaHora(e.createdAt)}</td>
                        <td className="td">
                          <div className="font-medium" style={{ color: 'var(--text)' }}>{e.herramienta?.nombre}</div>
                          <div className="mono text-xs" style={{ color: 'var(--accent)' }}>{e.herramienta?.codigo}</div>
                        </td>
                        <td className="td whitespace-nowrap"><b className="font-semibold tabular-nums" style={{ color: 'var(--green)' }}>+{e.cantidad}</b> {e.herramienta?.unidad}</td>
                        <td className="td">{e.proveedor || '—'}</td>
                        <td className="td">{e.recibio || '—'}</td>
                        <td className="td">{e.notas || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="md:hidden space-y-3">
                {visibles.map(e => (
                  <li key={e.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium" style={{ color: 'var(--text)' }}>{e.herramienta?.nombre}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{fechaHora(e.createdAt)}</div>
                      </div>
                      <span className="whitespace-nowrap text-sm" style={{ color: 'var(--text-2)' }}><b className="font-semibold tabular-nums" style={{ color: 'var(--green)' }}>+{e.cantidad}</b> {e.herramienta?.unidad}</span>
                    </div>
                    {(e.proveedor || e.recibio || e.notas) && (
                      <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{[e.proveedor, e.recibio && `Recibió ${e.recibio}`, e.notas].filter(Boolean).join(' · ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {modal && (
        <Modal titulo="Registrar entrada" subtitulo="Ingreso de material al almacén" onCerrar={() => setModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Campo etiqueta="Material">
              <select className="input-field" required value={form.herramientaId} onChange={e => set('herramientaId', e.target.value)}>
                <option value="">Selecciona un material</option>
                {herramientas.map(h => <option key={h.id} value={h.id}>{h.nombre} ({h.codigo}) · Stock: {h.stockDisp}</option>)}
              </select>
            </Campo>
            <Link to="/app/inventario" className="inline-block text-sm hover:underline" style={{ color: 'var(--accent)' }}>¿Material nuevo? Agrégalo en Materiales</Link>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Cantidad"><input type="number" min="1" required className="input-field mono" value={form.cantidad} onChange={e => set('cantidad', e.target.value)} /></Campo>
              <Campo etiqueta="Proveedor"><input className="input-field" value={form.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="HISCO" /></Campo>
            </div>
            <Campo etiqueta="Recibió"><input className="input-field" value={form.recibio} onChange={e => set('recibio', e.target.value)} placeholder="Nombre de quien recibió" /></Campo>
            <Campo etiqueta="Notas (opcional)"><input className="input-field" value={form.notas} onChange={e => set('notas', e.target.value)} /></Campo>
            <button type="submit" disabled={enviando} className="btn-accent w-full justify-center disabled:opacity-60">{enviando ? 'Registrando...' : 'Registrar entrada'}</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
