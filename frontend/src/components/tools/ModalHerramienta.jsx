import { useState } from 'react'
import api from '../../lib/api'
import useAuthStore from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Campo, Modal, Segmentos } from '../ui'

export default function ModalHerramienta({ herramienta, categorias, onClose, onSave }) {
  const user = useAuthStore(s => s.user)
  const isEdit = !!herramienta
  const isAdmin = ['ADMIN', 'TOOLCRIP'].includes(user?.role)

  const [form, setForm] = useState({
    codigo: herramienta?.codigo || '',
    nombre: herramienta?.nombre || '',
    descripcion: herramienta?.descripcion || '',
    categoriaId: herramienta?.categoriaId || '',
    stockTotal: herramienta?.stockTotal ?? '',
    stockMin: herramienta?.stockMin ?? 1,
    ubicacion_texto: herramienta?.ubicacion_texto || '',
    unidad: herramienta?.unidad || 'pza',
  })

  const [stockAdj, setStockAdj] = useState({ cantidad: '', tipo: 'ENTRADA', nota: '' })
  const [tab, setTab] = useState('info')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/herramientas/${herramienta.id}`, form)
        toast.success('Material actualizado')
      } else {
        await api.post('/herramientas', form)
        toast.success('Material registrado')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar')
    } finally { setLoading(false) }
  }

  const handleStockAdj = async (e) => {
    e.preventDefault()
    if (!stockAdj.cantidad) return toast.error('Ingresa una cantidad')
    setLoading(true)
    try {
      await api.post(`/herramientas/${herramienta.id}/stock`, { ...stockAdj, cantidad: +stockAdj.cantidad })
      toast.success('Stock ajustado')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo ajustar el stock')
    } finally { setLoading(false) }
  }

  return (
    <Modal titulo={isEdit ? herramienta.nombre : 'Nuevo material'} subtitulo={isEdit ? herramienta.codigo : undefined} onCerrar={onClose} ancho="max-w-lg">
      {isEdit && isAdmin && (
        <div className="mb-5">
          <Segmentos valor={tab} onCambio={setTab} opciones={[{ valor: 'info', etiqueta: 'Información' }, { valor: 'stock', etiqueta: 'Ajustar stock' }]} />
        </div>
      )}

      {(!isEdit || tab === 'info') && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Campo etiqueta="Código"><input className="input-field mono" required value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="TC-001" disabled={!isAdmin} /></Campo>
            <div className="sm:col-span-2">
              <Campo etiqueta="Nombre"><input className="input-field" required value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Multímetro Fluke 87V" disabled={!isAdmin} /></Campo>
            </div>
          </div>
          <Campo etiqueta="Descripción (opcional)"><input className="input-field" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} disabled={!isAdmin} /></Campo>
          <Campo etiqueta="Categoría">
            <select className="input-field" required value={form.categoriaId} onChange={e => set('categoriaId', e.target.value)} disabled={!isAdmin}>
              <option value="">Selecciona una categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Campo>
          <div className="grid grid-cols-3 gap-3">
            <Campo etiqueta="Stock total"><input type="number" min="0" className="input-field mono" value={form.stockTotal} onChange={e => set('stockTotal', e.target.value)} disabled={!isAdmin || isEdit} /></Campo>
            <Campo etiqueta="Stock mínimo"><input type="number" min="0" className="input-field mono" value={form.stockMin} onChange={e => set('stockMin', e.target.value)} disabled={!isAdmin} /></Campo>
            <Campo etiqueta="Unidad"><input className="input-field mono" value={form.unidad} onChange={e => set('unidad', e.target.value)} placeholder="pza" disabled={!isAdmin} /></Campo>
          </div>
          {isEdit && <p className="text-xs" style={{ color: 'var(--muted)' }}>El stock total se cambia desde Ajustar stock, para que quede registrado en Movimientos.</p>}
          <Campo etiqueta="Ubicación"><input className="input-field" value={form.ubicacion_texto} onChange={e => set('ubicacion_texto', e.target.value)} placeholder="Estante A-3" disabled={!isAdmin} /></Campo>
          {isAdmin && (
            <button type="submit" disabled={loading} className="btn-accent w-full justify-center disabled:opacity-60">
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar material'}
            </button>
          )}
        </form>
      )}

      {isEdit && tab === 'stock' && isAdmin && (
        <form onSubmit={handleStockAdj} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <div className="text-sm" style={{ color: 'var(--text-2)' }}>Disponible</div>
              <div className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{herramienta.stockDisp}</div>
            </div>
            <div className="stat-card">
              <div className="text-sm" style={{ color: 'var(--text-2)' }}>Total</div>
              <div className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{herramienta.stockTotal}</div>
            </div>
          </div>
          <Campo etiqueta="Tipo de movimiento">
            <select className="input-field" value={stockAdj.tipo} onChange={e => setStockAdj(a => ({ ...a, tipo: e.target.value }))}>
              <option value="ENTRADA">Entrada (agregar)</option>
              <option value="AJUSTE">Ajuste (quitar)</option>
              <option value="BAJA">Baja (quitar permanente)</option>
            </select>
          </Campo>
          <Campo etiqueta="Cantidad"><input type="number" min="1" required className="input-field mono" value={stockAdj.cantidad} onChange={e => setStockAdj(a => ({ ...a, cantidad: e.target.value }))} /></Campo>
          <Campo etiqueta="Nota"><input className="input-field" value={stockAdj.nota} onChange={e => setStockAdj(a => ({ ...a, nota: e.target.value }))} placeholder="Motivo del ajuste" /></Campo>
          <button type="submit" disabled={loading} className="btn-accent w-full justify-center disabled:opacity-60">
            {loading ? 'Aplicando...' : 'Aplicar movimiento'}
          </button>
        </form>
      )}
    </Modal>
  )
}
