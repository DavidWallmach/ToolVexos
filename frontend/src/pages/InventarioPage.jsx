import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Package, ChevronRight, CloudOff } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import useAuthStore from '../hooks/useAuth'
import ModalHerramienta from '../components/tools/ModalHerramienta'
import { EstadoVacio, PageHeader } from '../components/ui'

const STATUS = {
  DISPONIBLE: ['badge-ok', 'Disponible'],
  AGOTADO: ['badge-danger', 'Agotado'],
  MANTENIMIENTO: ['badge-maint', 'Mantenimiento'],
  BAJA: ['badge-baja', 'Baja'],
}

// Un material disponible pero en su mínimo se avisa como stock bajo
function EstadoBadge({ h }) {
  if (h.status === 'DISPONIBLE' && h.stockDisp <= h.stockMin) return <span className="badge-low">Stock bajo</span>
  const [clase, etiqueta] = STATUS[h.status] || ['badge-baja', h.status]
  return <span className={clase}>{etiqueta}</span>
}

const colorStock = (h) => {
  if (h.stockDisp === 0) return 'var(--red)'
  if (h.stockDisp <= h.stockMin) return 'var(--accent)'
  return 'var(--green)'
}

function Stock({ h }) {
  const pct = h.stockTotal > 0 ? Math.min((h.stockDisp / h.stockTotal) * 100, 100) : 0
  return (
    <div className="min-w-[96px]">
      <div className="text-sm" style={{ color: 'var(--text-2)' }}>
        <b className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{h.stockDisp}</b> de {h.stockTotal} {h.unidad}
      </div>
      <div className="h-1 mt-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colorStock(h) }} />
      </div>
    </div>
  )
}

export default function InventarioPage() {
  const user = useAuthStore(s => s.user)
  const [herramientas, setHerramientas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fallo, setFallo] = useState(false)
  const ultimaCarga = useRef(0)
  const puedeEditar = ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const hayFiltros = search || catFilter || statusFilter

  const load = async () => {
    const id = ++ultimaCarga.current
    setLoading(true)
    setFallo(false)
    const params = {}
    if (search) params.search = search
    if (catFilter) params.categoriaId = catFilter
    if (statusFilter) params.status = statusFilter
    try {
      const [h, c] = await Promise.all([api.get('/herramientas', { params }), api.get('/categorias')])
      // Una respuesta lenta de una búsqueda anterior no debe pisar la más reciente
      if (id !== ultimaCarga.current) return
      setHerramientas(h.data.herramientas)
      setCategorias(c.data.categorias)
    } catch {
      if (id === ultimaCarga.current) setFallo(true)
    }
    if (id === ultimaCarga.current) setLoading(false)
  }

  // La espera evita una petición a la API por cada letra escrita
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [search, catFilter, statusFilter])

  const abrir = (h) => { setSelected(h); setModal(true) }

  const conteo = loading ? 'Cargando...' : `${herramientas.length} ${herramientas.length === 1 ? 'material' : 'materiales'}${hayFiltros ? ' encontrados' : ''}`

  return (
    <div className="page-padding">
      <PageHeader titulo="Materiales" subtitulo={conteo}>
        {puedeEditar && (
          <button onClick={() => abrir(null)} className="btn-accent"><Plus size={16} /> Agregar material</button>
        )}
      </PageHeader>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input className="input-field" style={{ paddingLeft: '2.25rem' }} aria-label="Buscar material" placeholder="Buscar por nombre o código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field flex-1 min-w-[150px] sm:flex-none sm:w-48" aria-label="Filtrar por categoría" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select className="input-field flex-1 min-w-[150px] sm:flex-none sm:w-44" aria-label="Filtrar por estado" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([valor, [, etiqueta]]) => <option key={valor} value={valor}>{etiqueta}</option>)}
        </select>
      </div>

      {fallo ? (
        <EstadoVacio icono={CloudOff} titulo="No se pudieron cargar los materiales" detalle="Revisa tu conexión e intenta de nuevo." accion="Reintentar" onAccion={load} />
      ) : !loading && herramientas.length === 0 ? (
        <EstadoVacio icono={Package}
          titulo={hayFiltros ? 'Ningún material coincide con tu búsqueda' : 'Todavía no hay materiales'}
          detalle={hayFiltros ? 'Prueba con otro nombre, código o filtro.' : 'Agrega el primero para empezar tu inventario.'}
          accion={!hayFiltros && puedeEditar ? 'Agregar material' : undefined} onAccion={() => abrir(null)} />
      ) : (
        <>
          {/* Tabla en pantallas medianas y grandes */}
          <div className="card hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  {['Código', 'Material', 'Categoría', 'Stock', 'Ubicación', 'Estado'].map(h => <th key={h} className="th">{h}</th>)}
                  <th className="th" aria-label="Abrir" />
                </tr>
              </thead>
              <tbody>
                {herramientas.map(h => (
                  <tr key={h.id} tabIndex={0} className="table-row cursor-pointer" onClick={() => abrir(h)} onKeyDown={e => { if (e.key === 'Enter') abrir(h) }}>
                    <td className="td mono" style={{ color: 'var(--accent)' }}>{h.codigo}</td>
                    <td className="td">
                      <div className="font-medium" style={{ color: 'var(--text)' }}>{h.nombre}</div>
                      {h.descripcion && <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{h.descripcion}</div>}
                    </td>
                    <td className="td">{h.categoria?.nombre}</td>
                    <td className="td"><Stock h={h} /></td>
                    <td className="td">{h.ubicacion_texto || <span style={{ color: 'var(--muted)' }}>Sin ubicación</span>}</td>
                    <td className="td"><EstadoBadge h={h} /></td>
                    <td className="td"><ChevronRight size={16} style={{ color: 'var(--muted)' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas en celular */}
          <ul className="md:hidden space-y-3">
            {herramientas.map(h => (
              <li key={h.id}>
                <button onClick={() => abrir(h)} className="card block w-full text-left p-4 transition-colors hover:bg-[var(--hover)]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="font-medium" style={{ color: 'var(--text)' }}>{h.nombre}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}><span className="mono" style={{ color: 'var(--accent)' }}>{h.codigo}</span> · {h.ubicacion_texto || 'Sin ubicación'}</div>
                    </div>
                    <EstadoBadge h={h} />
                  </div>
                  <Stock h={h} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

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
