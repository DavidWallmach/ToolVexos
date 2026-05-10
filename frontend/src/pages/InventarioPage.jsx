import { useEffect, useState } from 'react'
import { Plus, Search, Package, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import ModalHerramienta from '../components/tools/ModalHerramienta'

const statusBadge = {
  DISPONIBLE: <span className="badge-ok">DISPONIBLE</span>,
  AGOTADO: <span className="badge-danger">AGOTADO</span>,
  MANTENIMIENTO: <span className="badge-maint">MANTENIMIENTO</span>,
  BAJA: <span className="badge-baja">BAJA</span>,
}

export default function InventarioPage() {
  const user = useAuthStore(s => s.user)
  const [herramientas, setHerramientas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (catFilter) params.categoriaId = catFilter
    if (statusFilter) params.status = statusFilter
    const [h, c] = await Promise.all([api.get('/herramientas', { params }), api.get('/categorias')])
    setHerramientas(h.data.herramientas)
    setCategorias(c.data.categorias)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, catFilter, statusFilter])

  const stockColor = (h) => {
    if (h.stockDisp === 0) return '#e74c3c'
    if (h.stockDisp <= h.stockMin) return '#f5a623'
    return '#2ecc71'
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>INVENTARIO</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>{herramientas.length} HERRAMIENTAS REGISTRADAS</div>
        </div>
        {user?.role === ['ADMIN', 'TOOLCRIP'].includes(user?.role) && (
          <button onClick={() => { setSelected(null); setModal(true) }} className="btn-accent display tracking-widest text-sm">
            <Plus size={14} /> AGREGAR
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#444'}} />
          <input className="input-field pl-9" placeholder="BUSCAR POR NOMBRE O CÓDIGO..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-44" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">CATEGORÍAS</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select className="input-field w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">TODOS</option>
          {['DISPONIBLE','AGOTADO','MANTENIMIENTO','BAJA'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card">
        <table className="w-full">
          <thead>
            <tr>
              {['CÓDIGO','HERRAMIENTA / MATERIAL','CATEGORÍA','STOCK DISP.','STOCK TOTAL','UBICACIÓN','STATUS',''].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="td mono text-xs text-center" style={{color:'#333'}}>CARGANDO...</td></tr>
            ) : herramientas.length === 0 ? (
              <tr><td colSpan={8} className="td mono text-xs text-center" style={{color:'#333'}}>SIN RESULTADOS</td></tr>
            ) : herramientas.map(h => (
              <tr key={h.id} className="table-row cursor-pointer" onClick={() => { setSelected(h); setModal(true) }}>
                <td className="td mono text-xs" style={{color:'#f5a623'}}>{h.codigo}</td>
                <td className="td">
                  <div className="text-sm" style={{color:'#e8e8e8'}}>{h.nombre}</div>
                  {h.descripcion && <div className="text-xs mt-0.5" style={{color:'#444'}}>{h.descripcion}</div>}
                </td>
                <td className="td mono text-xs" style={{color:'#555'}}>{h.categoria?.nombre}</td>
                <td className="td">
                  <span className="mono text-sm font-semibold" style={{color: stockColor(h)}}>{h.stockDisp}</span>
                  <span className="mono text-xs ml-1" style={{color:'#444'}}>{h.unidad}</span>
                </td>
                <td className="td mono text-xs" style={{color:'#555'}}>{h.stockTotal} {h.unidad}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{h.ubicacion || '—'}</td>
                <td className="td">{statusBadge[h.status]}</td>
                <td className="td"><ChevronRight size={14} style={{color:'#333'}} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ModalHerramienta
          herramienta={selected}
          categorias={categorias}
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); load() }}
        />
      )}
    </div>
  )
}
