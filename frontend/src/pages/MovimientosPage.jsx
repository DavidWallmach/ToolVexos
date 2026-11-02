import { useState } from 'react'
import { Activity } from 'lucide-react'
import api from '../lib/api'
import useCarga from '../hooks/useCarga'
import { coincide, fechaHora } from '../lib/format'
import { Buscador, Cargando, ErrorCarga, EstadoVacio, PageHeader, Segmentos } from '../components/ui'

const TIPOS = {
  ENTRADA: ['badge-ok', 'Entrada', '+'],
  SALIDA: ['badge-low', 'Salida', '−'],
  DEVOLUCION: ['badge-maint', 'Devolución', '+'],
  AJUSTE: ['badge-baja', 'Ajuste', '−'],
  BAJA: ['badge-danger', 'Baja', '−'],
}
const FILTROS = [{ valor: '', etiqueta: 'Todos' }, ...Object.entries(TIPOS).map(([valor, [, etiqueta]]) => ({ valor, etiqueta }))]
const LIMITE_API = 100

function Tipo({ tipo }) {
  const [clase, etiqueta] = TIPOS[tipo] || ['badge-baja', tipo]
  return <span className={clase}>{etiqueta}</span>
}

function Cantidad({ m }) {
  const signo = TIPOS[m.tipo]?.[2] || ''
  return <b className="font-semibold tabular-nums" style={{ color: signo === '+' ? 'var(--green)' : 'var(--text)' }}>{signo}{m.cantidad}</b>
}

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')

  const { loading, fallo, recargar } = useCarga(async () => {
    const { data } = await api.get('/movimientos')
    return () => setMovimientos(data.movimientos)
  })

  const visibles = movimientos.filter(m =>
    (!tipo || m.tipo === tipo) && coincide(busqueda, m.herramienta?.nombre, m.herramienta?.codigo, m.user?.nombre, m.nota))

  return (
    <div className="page-padding">
      <PageHeader titulo="Movimientos"
        subtitulo={movimientos.length >= LIMITE_API ? `Mostrando los últimos ${LIMITE_API} movimientos` : 'Historial de entradas, salidas y ajustes'} />

      {fallo ? <ErrorCarga que="los movimientos" onReintentar={recargar} />
      : loading ? <Cargando texto="Cargando movimientos..." />
      : movimientos.length === 0 ? <EstadoVacio icono={Activity} titulo="Todavía no hay movimientos" detalle="Cada entrada, salida o ajuste aparecerá aquí." />
      : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Buscador valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por material, usuario o nota..." />
            <Segmentos opciones={FILTROS} valor={tipo} onCambio={setTipo} />
          </div>

          {visibles.length === 0 ? <EstadoVacio titulo="Ningún movimiento coincide con tu búsqueda" /> : (
            <>
              <div className="card hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr>{['Fecha', 'Material', 'Tipo', 'Cantidad', 'Stock', 'Usuario', 'Nota'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {visibles.map(m => (
                      <tr key={m.id} className="table-row">
                        <td className="td whitespace-nowrap">{fechaHora(m.createdAt)}</td>
                        <td className="td">
                          <div className="font-medium" style={{ color: 'var(--text)' }}>{m.herramienta?.nombre}</div>
                          <div className="mono text-xs" style={{ color: 'var(--accent)' }}>{m.herramienta?.codigo}</div>
                        </td>
                        <td className="td"><Tipo tipo={m.tipo} /></td>
                        <td className="td"><Cantidad m={m} /></td>
                        <td className="td whitespace-nowrap tabular-nums">{m.stockAntes} → <span style={{ color: 'var(--text)' }}>{m.stockDespues}</span></td>
                        <td className="td">{m.user?.nombre}</td>
                        <td className="td">{m.nota || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="md:hidden space-y-3">
                {visibles.map(m => (
                  <li key={m.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="font-medium min-w-0" style={{ color: 'var(--text)' }}>{m.herramienta?.nombre}</div>
                      <Cantidad m={m} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                      <Tipo tipo={m.tipo} />
                      <span className="tabular-nums">Stock {m.stockAntes} → {m.stockDespues}</span>
                      <span>{fechaHora(m.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{[m.user?.nombre, m.nota].filter(Boolean).join(' · ')}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
