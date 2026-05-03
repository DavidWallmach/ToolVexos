import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, ShoppingCart } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function AlertasPage() {
  const [herramientas, setHerramientas] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/herramientas')
    setHerramientas(data.herramientas)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const agotados = herramientas.filter(h => h.stockDisp === 0 && h.status !== 'BAJA')
  const stockBajo = herramientas.filter(h => h.stockDisp > 0 && h.stockDisp <= h.stockMin)
  const enMant = herramientas.filter(h => h.status === 'MANTENIMIENTO')

  const handleComprar = (h) => {
    toast(`Redirigir a entrada para reponer: ${h.nombre}`, { icon: '🛒' })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="display text-3xl" style={{color:'#e8e8e8'}}>ALERTAS DE STOCK</div>
        <div className="mono text-xs mt-0.5" style={{color:'#444'}}>MATERIALES QUE REQUIEREN ATENCIÓN</div>
      </div>

      {loading ? <div className="mono text-xs" style={{color:'#444'}}>CARGANDO...</div> : (
        <>
          {agotados.length === 0 && stockBajo.length === 0 && enMant.length === 0 && (
            <div className="card p-8 text-center">
              <div className="display text-2xl mb-2" style={{color:'#2ecc71'}}>TODO EN ORDEN</div>
              <div className="mono text-xs" style={{color:'#444'}}>No hay alertas activas en este momento</div>
            </div>
          )}

          {agotados.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{background:'#e74c3c'}} />
                <span className="mono text-xs font-semibold tracking-widest" style={{color:'#e74c3c'}}>AGOTADOS ({agotados.length})</span>
              </div>
              <div className="space-y-2">
                {agotados.map(h => (
                  <AlertCard key={h.id} h={h} color="#e74c3c" bg="#e74c3c10" onComprar={handleComprar}
                    label={`0 ${h.unidad}`} sublabel={`Mínimo requerido: ${h.stockMin} ${h.unidad}`} badge="AGOTADO" />
                ))}
              </div>
            </div>
          )}

          {stockBajo.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{background:'#f5a623'}} />
                <span className="mono text-xs font-semibold tracking-widest" style={{color:'#f5a623'}}>STOCK BAJO ({stockBajo.length})</span>
              </div>
              <div className="space-y-2">
                {stockBajo.map(h => (
                  <AlertCard key={h.id} h={h} color="#f5a623" bg="#f5a62310" onComprar={handleComprar}
                    label={`${h.stockDisp} ${h.unidad}`} sublabel={`Mínimo: ${h.stockMin} ${h.unidad}`} badge="STOCK BAJO" />
                ))}
              </div>
            </div>
          )}

          {enMant.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{background:'#3b82f6'}} />
                <span className="mono text-xs font-semibold tracking-widest" style={{color:'#3b82f6'}}>EN MANTENIMIENTO ({enMant.length})</span>
              </div>
              <div className="space-y-2">
                {enMant.map(h => (
                  <AlertCard key={h.id} h={h} color="#3b82f6" bg="#3b82f610" onComprar={null}
                    label={`${h.stockDisp} ${h.unidad}`} sublabel="En proceso de mantenimiento" badge="MANTENIMIENTO" />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AlertCard({ h, color, bg, badge, label, sublabel, onComprar }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-l-2" style={{background: bg, borderColor: color, borderTop:'1px solid',borderRight:'1px solid',borderBottom:'1px solid', borderTopColor:'#1a1a1a', borderRightColor:'#1a1a1a', borderBottomColor:'#1a1a1a'}}>
      <div className="flex items-center gap-4">
        <AlertTriangle size={16} style={{color}} />
        <div>
          <div className="text-sm font-medium" style={{color:'#e8e8e8'}}>{h.nombre}</div>
          <div className="mono text-xs mt-0.5" style={{color:'#555'}}>{h.codigo} · {h.categoria?.nombre} · {h.ubicacion_texto || '—'}</div>
          <div className="mono text-xs mt-0.5" style={{color:'#444'}}>{sublabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="mono text-lg font-bold" style={{color}}>{label}</div>
          <div className="mono text-xs" style={{color:'#444', fontSize:'9px'}}>{badge}</div>
        </div>
        {onComprar && (
          <button onClick={() => onComprar(h)} className="btn-danger text-xs py-1.5 px-3">
            <ShoppingCart size={12} /> COMPRAR
          </button>
        )}
      </div>
    </div>
  )
}
