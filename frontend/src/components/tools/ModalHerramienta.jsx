import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../../lib/api'
import useAuthStore from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export default function ModalHerramienta({ herramienta, categorias, onClose, onSave }) {
  const user = useAuthStore(s => s.user)
  const isEdit = !!herramienta
  const isAdmin = ['ADMIN', 'TOOLCRIP'].includes(user?.role)

  const [form, setForm] = useState({
    codigo: herramienta?.codigo || '',
    nombre: herramienta?.nombre || '',
    descripcion: herramienta?.descripcion || '',
    categoriaId: herramienta?.categoriaId || '',
    stockTotal: herramienta?.stockTotal || '',
    stockMin: herramienta?.stockMin || 1,
    ubicacion_texto: herramienta?.ubicacion_texto || '',
    unidad: herramienta?.unidad || 'pza',
  })

  const [stockAdj, setStockAdj] = useState({ cantidad: '', tipo: 'ENTRADA', nota: '' })
  const [tab, setTab] = useState('info')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/herramientas/${herramienta.id}`, form)
        toast.success('Herramienta actualizada')
      } else {
        await api.post('/herramientas', form)
        toast.success('Herramienta registrada')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const handleStockAdj = async () => {
    if (!stockAdj.cantidad) return toast.error('Ingresa una cantidad')
    setLoading(true)
    try {
      await api.post(`/herramientas/${herramienta.id}/stock`, { ...stockAdj, cantidad: +stockAdj.cantidad })
      toast.success('Stock ajustado')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al ajustar')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.85)'}}>
      <div className="w-full max-w-lg card" style={{maxHeight:'85vh', overflowY:'auto'}}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'#1a1a1a'}}>
          <div>
            <div className="display text-xl" style={{color:'#f5a623'}}>{isEdit ? herramienta.nombre : 'NUEVA HERRAMIENTA'}</div>
            {isEdit && <div className="mono text-xs" style={{color:'#444'}}>{herramienta.codigo}</div>}
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={16} /></button>
        </div>

        {/* Tabs (solo en edición) */}
        {isEdit && (
          <div className="flex border-b" style={{borderColor:'#1a1a1a'}}>
            {['info', 'stock'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`mono text-xs px-5 py-3 tracking-widest transition-colors ${tab === t ? 'text-[#f5a623] border-b-2 border-[#f5a623]' : 'text-[#444]'}`}
              >{t.toUpperCase()}</button>
            ))}
          </div>
        )}

        <div className="p-5 space-y-4">
          {(!isEdit || tab === 'info') && (
            <>
              <Row label="CÓDIGO"><input className="input-field mono" value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="TC-001" disabled={!isAdmin} /></Row>
              <Row label="NOMBRE"><input className="input-field" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Multímetro Fluke 87V" disabled={!isAdmin} /></Row>
              <Row label="DESCRIPCIÓN"><input className="input-field" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Opcional" disabled={!isAdmin} /></Row>
              <Row label="CATEGORÍA">
                <select className="input-field" value={form.categoriaId} onChange={e => set('categoriaId', e.target.value)} disabled={!isAdmin}>
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Row>
              <div className="grid grid-cols-3 gap-3">
                <Row label="STOCK TOTAL"><input type="number" className="input-field mono" value={form.stockTotal} onChange={e => set('stockTotal', e.target.value)} disabled={!isAdmin || isEdit} /></Row>
                <Row label="STOCK MÍN."><input type="number" className="input-field mono" value={form.stockMin} onChange={e => set('stockMin', e.target.value)} disabled={!isAdmin} /></Row>
                <Row label="UNIDAD"><input className="input-field mono" value={form.unidad} onChange={e => set('unidad', e.target.value)} placeholder="pza" disabled={!isAdmin} /></Row>
              </div>
              <Row label="UBICACIÓN"><input className="input-field" value={form.ubicacion_texto} onChange={e => set('ubicacion_texto', e.target.value)} placeholder="Estante A-3" disabled={!isAdmin} /></Row>
              {isAdmin && (
                <button onClick={handleSave} disabled={loading} className="btn-accent w-full justify-center display tracking-widest mt-2">
                  {loading ? 'GUARDANDO...' : isEdit ? 'ACTUALIZAR' : 'REGISTRAR'}
                </button>
              )}
            </>
          )}

          {isEdit && tab === 'stock' && isAdmin && (
            <>
              <div className="flex gap-4 mb-2">
                <div className="stat-card flex-1 text-center">
                  <div className="mono text-xs mb-1" style={{color:'#555'}}>DISPONIBLE</div>
                  <div className="display text-3xl" style={{color:'#f5a623'}}>{herramienta.stockDisp}</div>
                </div>
                <div className="stat-card flex-1 text-center" style={{borderLeftColor:'#555'}}>
                  <div className="mono text-xs mb-1" style={{color:'#555'}}>TOTAL</div>
                  <div className="display text-3xl" style={{color:'#888'}}>{herramienta.stockTotal}</div>
                </div>
              </div>
              <Row label="TIPO DE MOVIMIENTO">
                <select className="input-field" value={stockAdj.tipo} onChange={e => setStockAdj(a => ({...a, tipo: e.target.value}))}>
                  <option value="ENTRADA">ENTRADA (agregar)</option>
                  <option value="AJUSTE">AJUSTE (quitar)</option>
                  <option value="BAJA">BAJA (quitar permanente)</option>
                </select>
              </Row>
              <Row label="CANTIDAD"><input type="number" className="input-field mono" value={stockAdj.cantidad} onChange={e => setStockAdj(a => ({...a, cantidad: e.target.value}))} placeholder="0" min={1} /></Row>
              <Row label="NOTA"><input className="input-field" value={stockAdj.nota} onChange={e => setStockAdj(a => ({...a, nota: e.target.value}))} placeholder="Motivo del ajuste..." /></Row>
              <button onClick={handleStockAdj} disabled={loading} className="btn-accent w-full justify-center display tracking-widest">
                {loading ? 'APLICANDO...' : 'APLICAR MOVIMIENTO'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <label className="mono text-xs tracking-widest mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>{label}</label>
      {children}
    </div>
  )
}