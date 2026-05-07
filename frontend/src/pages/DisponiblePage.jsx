import { useEffect, useState } from 'react'
import { Search, Package } from 'lucide-react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function DisponiblePage() {
  const [herramientas, setHerramientas] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    api.get('/herramientas', { params }).then(r => {
      setHerramientas(r.data.herramientas)
      setLoading(false)
    })
  }, [search])

  const stockColor = (h) => {
    if (h.stockDisp === 0) return '#e74c3c'
    if (h.stockDisp <= h.stockMin) return '#f5a623'
    return '#2ecc71'
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="display text-3xl" style={{color:'#e8e8e8'}}>MATERIAL DISPONIBLE</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>CONSULTA EL STOCK ANTES DE SOLICITAR</div>
        </div>
        <button onClick={() => navigate('/app/mis-tickets')} className="btn-accent display tracking-widest text-sm">
          + SOLICITAR MATERIAL
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#444'}} />
        <input className="input-field pl-9" placeholder="BUSCAR MATERIAL..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['CÓDIGO','MATERIAL','CATEGORÍA','DISPONIBLE','UNIDAD','UBICACIÓN','STATUS'].map(h=><th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="td mono text-xs text-center" style={{color:'#333'}}>CARGANDO...</td></tr>
            : herramientas.filter(h => h.status !== 'BAJA').map(h => (
              <tr key={h.id} className="table-row">
                <td className="td mono text-xs" style={{color:'#f5a623'}}>{h.codigo}</td>
                <td className="td">
                  <div className="text-sm" style={{color:'#e8e8e8'}}>{h.nombre}</div>
                  {h.descripcion && <div className="text-xs" style={{color:'#444'}}>{h.descripcion}</div>}
                </td>
                <td className="td mono text-xs" style={{color:'#555'}}>{h.categoria?.nombre}</td>
                <td className="td">
                  <span className="mono text-lg font-bold" style={{color: stockColor(h)}}>{h.stockDisp}</span>
                </td>
                <td className="td mono text-xs" style={{color:'#555'}}>{h.unidad}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{h.ubicacion_texto || '—'}</td>
                <td className="td">
                  {h.stockDisp === 0 ? <span className="badge-danger">AGOTADO</span>
                  : h.status === 'MANTENIMIENTO' ? <span className="badge-maint">MANTENIMIENTO</span>
                  : h.stockDisp <= h.stockMin ? <span className="badge-low">STOCK BAJO</span>
                  : <span className="badge-ok">DISPONIBLE</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
