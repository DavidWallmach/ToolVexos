import { useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Printer, Ticket, CloudOff } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import useAuthStore from '../hooks/useAuth'
import { fechaHora } from '../lib/format'
import { Campo, EstadoVacio, Modal, PageHeader, Segmentos } from '../components/ui'

const STATUS = {
  PENDIENTE: ['badge-low', 'Pendiente', 'var(--accent)'],
  PARCIAL: ['badge-maint', 'Parcial', 'var(--blue)'],
  DESPACHADO: ['badge-ok', 'Despachado', 'var(--green)'],
  RECHAZADO: ['badge-danger', 'Rechazado', 'var(--red)'],
}
const FILTROS = [...Object.entries(STATUS).map(([valor, [, etiqueta]]) => ({ valor, etiqueta })), { valor: 'TODOS', etiqueta: 'Todos' }]
const ROLES = { ADMIN: 'Administrador', TOOLCRIP: 'Toolcrip', SUPERVISOR: 'Supervisor', JEFE_GRUPO: 'Jefe de grupo', OPERADOR: 'Operador' }

const separarMotivo = (motivo = '') => {
  const [texto, operador] = motivo.split('| Operador:')
  return { texto: texto.trim(), operador: operador?.trim() }
}

// Se usan tanto en la vista previa (anidados en .comprobante) como en la ventana de impresión
const ESTILOS_COMPROBANTE = `
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
  .logo { font-size: 28px; font-weight: 900; letter-spacing: 4px; }
  .logo span { color: #000; }
  .subtitle { font-size: 9px; letter-spacing: 2px; margin-top: 2px; }
  .folio { font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0; letter-spacing: 2px; border: 2px solid #000; padding: 6px; }
  .section { margin: 8px 0; }
  .label { font-size: 8px; letter-spacing: 1px; color: #666; text-transform: uppercase; }
  .value { font-size: 13px; font-weight: bold; margin-top: 2px; }
  .value-sm { font-size: 11px; margin-top: 2px; }
  .divider { border-top: 1px dashed #000; margin: 8px 0; }
  .cantidad-box { border: 2px solid #000; padding: 8px; text-align: center; margin: 10px 0; }
  .cantidad-num { font-size: 36px; font-weight: 900; line-height: 1; }
  .cantidad-unit { font-size: 12px; letter-spacing: 2px; }
  .status { text-align: center; font-size: 11px; font-weight: bold; letter-spacing: 2px; padding: 4px; border: 1px solid #000; margin: 8px 0; }
  .footer { text-align: center; font-size: 8px; color: #666; margin-top: 12px; padding-top: 8px; border-top: 1px solid #ccc; }
  .firma { margin-top: 20px; border-top: 1px solid #000; padding-top: 4px; font-size: 9px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
`

// ─── Componente de impresión ──────────────────────────────────
function TicketPrint({ ticket, encargado, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=400,height=600')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket ${ticket.folio}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; background: #fff; color: #000; padding: 20px; width: 320px; }
          ${ESTILOS_COMPROBANTE}
          @media print {
            body { width: 100%; }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  const { texto: motivo, operador } = separarMotivo(ticket.motivo)
  const fechaImpresion = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
  const notaFina = { fontSize: '10px', color: '#555' }

  return (
    <Modal titulo="Vista previa del comprobante" subtitulo={ticket.folio} onCerrar={onClose} ancho="max-w-lg">
      <button onClick={handlePrint} className="btn-accent w-full justify-center mb-4"><Printer size={16} /> Imprimir</button>

      <style>{`.comprobante { ${ESTILOS_COMPROBANTE} }`}</style>
      {/* El contenido se copia a la ventana de impresión, por eso conserva colores fijos sobre blanco */}
      <div ref={printRef} className="comprobante rounded-lg" style={{ fontFamily: 'Courier New, monospace', color: '#000', background: '#fff', padding: '16px' }}>
        <div className="header">
          <div className="logo">TOOL<span>CRIP</span></div>
          <div className="subtitle">SISTEMA DE GESTIÓN DE ALMACÉN</div>
          <div className="subtitle" style={{ marginTop: '4px' }}>COMPROBANTE DE SALIDA DE MATERIAL</div>
        </div>

        <div className="folio">{ticket.folio}</div>

        <div className="grid">
          <div className="section">
            <div className="label">Solicitante</div>
            <div className="value-sm">{ticket.user?.nombre}</div>
            <div style={notaFina}>{ticket.user?.empleado} · {ticket.user?.role}</div>
          </div>
          <div className="section">
            <div className="label">Operador</div>
            <div className="value-sm">{operador || '—'}</div>
          </div>
        </div>

        <div className="divider" />

        <div className="section">
          <div className="label">Material</div>
          <div className="value">{ticket.herramienta?.nombre}</div>
          <div style={notaFina}>{ticket.herramienta?.codigo}</div>
        </div>

        <div className="cantidad-box">
          <div className="label">Cantidad despachada</div>
          <div className="cantidad-num">{ticket.cantidadDespachada || ticket.cantidad}</div>
          <div className="cantidad-unit">{ticket.herramienta?.unidad}</div>
          {ticket.cantidadDespachada < ticket.cantidad && (
            <div style={{ ...notaFina, marginTop: '4px' }}>de {ticket.cantidad} solicitadas — DESPACHO PARCIAL</div>
          )}
        </div>

        <div className="section">
          <div className="label">Motivo / Justificación</div>
          <div className="value-sm">{motivo}</div>
        </div>

        <div className="divider" />

        <div className="grid">
          <div className="section">
            <div className="label">Fecha solicitud</div>
            <div style={{ fontSize: '10px' }}>{fechaHora(ticket.createdAt)}</div>
          </div>
          <div className="section">
            <div className="label">Fecha impresión</div>
            <div style={{ fontSize: '10px' }}>{fechaImpresion}</div>
          </div>
        </div>

        <div className="status">{ticket.status}</div>

        {ticket.nota && (
          <div className="section">
            <div className="label">Nota del encargado</div>
            <div style={{ fontSize: '10px' }}>{ticket.nota}</div>
          </div>
        )}

        <div className="divider" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
          <div className="firma"><div style={notaFina}>Firma Solicitante</div></div>
          <div className="firma">
            <div style={notaFina}>Firma Encargado Tool Crib</div>
            {encargado && <div style={{ fontSize: '10px', marginTop: '2px' }}>{encargado}</div>}
          </div>
        </div>

        <div className="footer">
          <div>TOOLCRIP — Sistema de Gestión de Almacén</div>
          <div>Este documento es un comprobante oficial de salida de material</div>
        </div>
      </div>
    </Modal>
  )
}

function TarjetaTicket({ t, onDespachar, onRechazar, onImprimir }) {
  const [claseBadge, etiqueta, color] = STATUS[t.status] || ['badge-baja', t.status, 'var(--muted)']
  const despachada = t.cantidadDespachada || 0
  const pendiente = t.cantidad - despachada
  const stockDisp = t.herramienta?.stockDisp || 0
  const unidad = t.herramienta?.unidad
  const abierto = ['PENDIENTE', 'PARCIAL'].includes(t.status)
  const imprimible = ['DESPACHADO', 'PARCIAL'].includes(t.status)
  const { texto, operador } = separarMotivo(t.motivo)

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
        <span className="mono text-sm font-semibold" style={{ color: 'var(--accent)' }}>{t.folio}</span>
        <span className={claseBadge}>{etiqueta}</span>
        <span className="text-xs sm:ml-auto" style={{ color: 'var(--muted)' }}>{fechaHora(t.createdAt)}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 mb-3">
        <div className="min-w-0 flex-1 basis-56">
          <div className="text-base font-semibold" style={{ color: 'var(--text)' }}>{t.herramienta?.nombre}</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{texto}</div>
        </div>
        <div className="basis-44">
          <div className="text-sm" style={{ color: 'var(--text-2)' }}>
            <b className="text-xl font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{despachada}</b> de {t.cantidad} {unidad} despachadas
          </div>
          <div className="h-1.5 mt-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
            <div className="h-full rounded-full" style={{ width: `${(despachada / t.cantidad) * 100}%`, background: color }} />
          </div>
        </div>
      </div>

      <div className="text-sm" style={{ color: 'var(--muted)' }}>
        Solicita <span style={{ color: 'var(--text-2)' }}>{t.user?.nombre}</span> · {ROLES[t.user?.role] || t.user?.role}
        {operador && <> · Para <span style={{ color: 'var(--text-2)' }}>{operador}</span></>}
      </div>

      {t.nota && (
        <div className="mt-3 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface2)', color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--muted)' }}>Nota: </span>{t.nota}
        </div>
      )}

      {(abierto || imprimible) && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          {abierto && (
            <span className="flex items-center gap-1.5 text-sm w-full sm:w-auto sm:mr-auto" style={{ color: stockDisp > 0 ? 'var(--text-2)' : 'var(--red)' }}>
              {stockDisp === 0 && <AlertTriangle size={15} />}
              {stockDisp > 0 ? `${stockDisp} ${unidad} en stock · faltan ${pendiente}` : 'Sin stock disponible'}
            </span>
          )}
          {imprimible && <button onClick={onImprimir} className="btn-ghost"><Printer size={15} /> Imprimir</button>}
          {abierto && <button onClick={onRechazar} className="btn-danger"><XCircle size={15} /> Rechazar</button>}
          {abierto && (
            <button onClick={onDespachar} disabled={stockDisp === 0} className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed">
              <CheckCircle size={15} /> Despachar
            </button>
          )}
        </div>
      )}
    </article>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function TicketsPage() {
  const user = useAuthStore(s => s.user)
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('PENDIENTE')
  const [loading, setLoading] = useState(true)
  const [fallo, setFallo] = useState(false)
  const [despachoModal, setDespachoModal] = useState(null)
  const [rechazarModal, setRechazarModal] = useState(null)
  const [printTicket, setPrintTicket] = useState(null)
  const [cantidadDespachar, setCantidadDespachar] = useState('')
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const ultimaCarga = useRef(0)

  const load = async () => {
    const id = ++ultimaCarga.current
    setLoading(true)
    setFallo(false)
    try {
      const params = filter !== 'TODOS' ? { status: filter } : {}
      const { data } = await api.get('/tickets', { params })
      if (id === ultimaCarga.current) setTickets(data.tickets)
    } catch {
      if (id === ultimaCarga.current) setFallo(true)
    }
    if (id === ultimaCarga.current) setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const cerrarModales = () => {
    setDespachoModal(null)
    setRechazarModal(null)
    setCantidadDespachar('')
    setNota('')
  }

  const handleDespachar = async (e) => {
    e.preventDefault()
    if (!cantidadDespachar || +cantidadDespachar <= 0) return toast.error('Ingresa una cantidad válida')
    setEnviando(true)
    try {
      const { data } = await api.post(`/tickets/${despachoModal.id}/despachar`, { cantidadDespachar: +cantidadDespachar, nota })
      toast.success(data.message)
      cerrarModales()
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo despachar')
      load()
    } finally { setEnviando(false) }
  }

  const handleRechazar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post(`/tickets/${rechazarModal.id}/rechazar`, { nota })
      toast.success('Ticket rechazado')
      cerrarModales()
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo rechazar')
    } finally { setEnviando(false) }
  }

  const pendingCount = tickets.filter(t => ['PENDIENTE', 'PARCIAL'].includes(t.status)).length
  const pendienteModal = despachoModal ? despachoModal.cantidad - (despachoModal.cantidadDespachada || 0) : 0
  const stockModal = despachoModal?.herramienta?.stockDisp || 0
  const unidadModal = despachoModal?.herramienta?.unidad
  const quedarian = pendienteModal - +cantidadDespachar

  return (
    <div className="page-padding">
      <PageHeader titulo="Tickets" subtitulo={pendingCount > 0 ? `${pendingCount} ${pendingCount === 1 ? 'requiere' : 'requieren'} tu atención` : 'Solicitudes de material'} />

      <div className="mb-4">
        <Segmentos opciones={FILTROS} valor={filter} onCambio={setFilter} />
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-sm" style={{ color: 'var(--muted)' }}>Cargando tickets...</p>
        : fallo ? (
          <EstadoVacio icono={CloudOff} titulo="No se pudieron cargar los tickets" detalle="Revisa tu conexión e intenta de nuevo." accion="Reintentar" onAccion={load} />
        ) : tickets.length === 0 ? (
          <EstadoVacio icono={Ticket} titulo={filter === 'PENDIENTE' ? 'No hay tickets pendientes' : 'No hay tickets en esta vista'} detalle="Las solicitudes nuevas aparecerán aquí." />
        ) : tickets.map(t => (
          <TarjetaTicket key={t.id} t={t}
            onDespachar={() => { setDespachoModal(t); setCantidadDespachar(String(Math.min(t.cantidad - (t.cantidadDespachada || 0), t.herramienta?.stockDisp || 0))) }}
            onRechazar={() => { setRechazarModal(t); setNota('') }}
            onImprimir={() => setPrintTicket(t)} />
        ))}
      </div>

      {despachoModal && (
        <Modal titulo="Despachar material" subtitulo={`${despachoModal.folio} · ${despachoModal.herramienta?.nombre}`} onCerrar={cerrarModales}>
          <form onSubmit={handleDespachar} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Faltan por entregar', pendienteModal], ['En stock', stockModal]].map(([etiqueta, valor]) => (
                <div key={etiqueta} className="stat-card">
                  <div className="text-sm" style={{ color: 'var(--text-2)' }}>{etiqueta}</div>
                  <div className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{valor} <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>{unidadModal}</span></div>
                </div>
              ))}
            </div>
            <Campo etiqueta="Cantidad a despachar" ayuda={cantidadDespachar !== '' && quedarian > 0 ? `Despacho parcial: quedarán ${quedarian} pendientes.` : undefined}>
              <input type="number" min="1" max={Math.min(pendienteModal, stockModal)} required autoFocus className="input-field mono"
                value={cantidadDespachar} onChange={e => setCantidadDespachar(e.target.value)} />
            </Campo>
            <Campo etiqueta="Nota (opcional)">
              <input className="input-field" value={nota} onChange={e => setNota(e.target.value)} placeholder="Resto disponible el lunes" />
            </Campo>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={cerrarModales} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button type="submit" disabled={enviando} className="btn-accent flex-1 justify-center disabled:opacity-60">{enviando ? 'Despachando...' : 'Confirmar despacho'}</button>
            </div>
          </form>
        </Modal>
      )}

      {rechazarModal && (
        <Modal titulo="Rechazar ticket" subtitulo={`${rechazarModal.folio} · ${rechazarModal.herramienta?.nombre}`} onCerrar={cerrarModales}>
          <form onSubmit={handleRechazar} className="space-y-4">
            <Campo etiqueta="Motivo del rechazo">
              <textarea className="input-field h-24 resize-none" autoFocus value={nota} onChange={e => setNota(e.target.value)} placeholder="Material en mantenimiento" />
            </Campo>
            <div className="flex gap-2">
              <button type="button" onClick={cerrarModales} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button type="submit" disabled={enviando} className="btn-danger flex-1 justify-center disabled:opacity-60">{enviando ? 'Rechazando...' : 'Rechazar ticket'}</button>
            </div>
          </form>
        </Modal>
      )}

      {printTicket && <TicketPrint ticket={printTicket} encargado={user?.nombre} onClose={() => setPrintTicket(null)} />}
    </div>
  )
}
