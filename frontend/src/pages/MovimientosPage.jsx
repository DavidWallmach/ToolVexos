import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import api from '../lib/api'

const tipoColor = { ENTRADA:'text-green-400', SALIDA:'text-[#f5a623]', DEVOLUCION:'text-blue-400', AJUSTE:'text-purple-400', BAJA:'text-red-400' }

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/movimientos').then(r => { setMovimientos(r.data.movimientos); setLoading(false) })
  }, [])

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="display text-3xl" style={{color:'#e8e8e8'}}>MOVIMIENTOS</div>
        <div className="mono text-xs mt-0.5" style={{color:'#444'}}>HISTORIAL DE ENTRADAS, SALIDAS Y AJUSTES</div>
      </div>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['FECHA','HERRAMIENTA','TIPO','CANT.','STOCK ANT.','STOCK NVO.','USUARIO','NOTA'].map(h=><th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="td mono text-xs text-center" style={{color:'#333'}}>CARGANDO...</td></tr>
            : movimientos.map(m => (
              <tr key={m.id} className="table-row">
                <td className="td mono text-xs" style={{color:'#555'}}>{new Date(m.createdAt).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}</td>
                <td className="td">
                  <div className="text-sm" style={{color:'#e8e8e8'}}>{m.herramienta?.nombre}</div>
                  <div className="mono text-xs" style={{color:'#444'}}>{m.herramienta?.codigo}</div>
                </td>
                <td className="td"><span className={`mono text-xs font-semibold ${tipoColor[m.tipo]}`}>{m.tipo}</span></td>
                <td className="td mono text-xs" style={{color:'#888'}}>{m.cantidad}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{m.stockAntes}</td>
                <td className="td mono text-xs" style={{color:'#e8e8e8'}}>{m.stockDespues}</td>
                <td className="td mono text-xs" style={{color:'#555'}}>{m.user?.nombre}</td>
                <td className="td text-xs" style={{color:'#444'}}>{m.nota || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
