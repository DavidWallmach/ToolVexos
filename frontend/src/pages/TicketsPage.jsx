import { useEffect, useState, useRef } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle, Printer } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import useAuthStore from '../hooks/useAuth'

const statusColor = {
  PENDIENTE: '#f5a623',
  PARCIAL: '#3b82f6',
  DESPACHADO: '#2ecc71',
  RECHAZADO: '#e74c3c'
}
const statusBg = {
  PENDIENTE: '#f5a62310',
  PARCIAL: '#3b82f610',
  DESPACHADO: '#2ecc7110',
  RECHAZADO: '#e74c3c10'
}

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

  const motivo = ticket.motivo.includes('| Operador:')
    ? ticket.motivo.split('| Operador:')[0].trim()
    : ticket.motivo
  const operador = ticket.motivo.includes('| Operador:')
    ? ticket.motivo.split('| Operador:')[1].trim()
    : '—'

  const now = new Date()
  const fechaImpresion = now.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.92)'}}>
      <div className="card" style={{maxWidth:'480px', width:'100%', maxHeight:'90vh', overflowY:'auto'}}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'#1a1a1a'}}>
          <div className="display text-xl" style={{color:'#f5a623'}}>VISTA PREVIA — {ticket.folio}</div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-accent display tracking-widest text-sm">
              <Printer size={14} /> IMPRIMIR
            </button>
            <button onClick={onClose} className="btn-ghost px-3 py-2 text-xs">✕</button>
          </div>
        </div>

        {/* Preview del ticket */}
        <div className="p-6">
          <div ref={printRef} style={{fontFamily:'Courier New, monospace', color:'#000', background:'#fff', padding:'16px', border:'1px solid #ddd'}}>
            {/* Header */}
            <div className="header">
              <div className="logo">TOOL<span>CRIP</span></div>
              <div className="subtitle">SISTEMA DE GESTIÓN DE ALMACÉN</div>
              <div className="subtitle" style={{marginTop:'4px'}}>COMPROBANTE DE SALIDA DE MATERIAL</div>
            </div>

            {/* Folio */}
            <div className="folio">{ticket.folio}</div>

            {/* Info principal */}
            <div className="grid">
              <div className="section">
                <div className="label">Solicitante</div>
                <div className="value-sm">{ticket.user?.nombre}</div>
                <div style={{fontSize:'9px', color:'#666'}}>{ticket.user?.empleado} · {ticket.user?.role}</div>
              </div>
              <div className="section">
                <div className="label">Operador</div>
                <div className="value-sm">{operador}</div>
              </div>
            </div>

            <div className="divider" />

            {/* Material */}
            <div className="section">
              <div className="label">Material</div>
              <div className="value">{ticket.herramienta?.nombre}</div>
              <div style={{fontSize:'10px', color:'#666'}}>{ticket.herramienta?.codigo}</div>
            </div>

            {/* Cantidad */}
            <div className="cantidad-box">
              <div className="label">Cantidad despachada</div>
              <div className="cantidad-num">{ticket.cantidadDespachada || ticket.cantidad}</div>
              <div className="cantidad-unit">{ticket.herramienta?.unidad}</div>
              {ticket.cantidadDespachada < ticket.cantidad && (
                <div style={{fontSize:'9px', color:'#666', marginTop:'4px'}}>
                  de {ticket.cantidad} solicitadas — DESPACHO PARCIAL
                </div>
              )}
            </div>

            {/* Motivo */}
            <div className="section">
              <div className="label">Motivo / Justificación</div>
              <div className="value-sm">{motivo}</div>
            </div>

            <div className="divider" />

            {/* Fechas y status */}
            <div className="grid">
              <div className="section">
                <div className="label">Fecha solicitud</div>
                <div style={{fontSize:'10px'}}>{new Date(ticket.createdAt).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}</div>
              </div>
              <div className="section">
                <div className="label">Fecha impresión</div>
                <div style={{fontSize:'10px'}}>{fechaImpresion}</div>
              </div>
            </div>

            <div className="status">{ticket.status}</div>

            {ticket.nota && (
              <div className="section">
                <div className="label">Nota del encargado</div>
                <div style={{fontSize:'10px'}}>{ticket.nota}</div>
              </div>
            )}

            <div className="divider" />

            {/* Firma */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginTop:'16px'}}>
              <div className="firma">
                <div style={{fontSize:'9px', color:'#666'}}>Firma Solicitante</div>
              </div>
              <div className="firma">
                <div style={{fontSize:'9px', color:'#666'}}>Firma Encargado Tool Crib</div>
                {encargado && <div style={{fontSize:'9px', marginTop:'2px'}}>{encargado}</div>}
              </div>
            </div>

            <div className="footer">
              <div>TOOLCRIP — Sistema de Gestión de Almacén</div>
              <div>Este documento es un comprobante oficial de salida de material</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function TicketsPage() {
  const user = useAuthStore(s => s.user)
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('PENDIENTE')
  const [loading, setLoading] = useState(true)
  const [despachoModal, setDespachoModal] = useState(null)
  const [rechazarModal, setRechazarModal] = useState(null)
  const [printTicket, setPrintTicket] = useState(null)
  const [cantidadDespachar, setCantidadDespachar] = useState('')
  const [nota, setNota] = useState('')

  const load = async () => {
    setLoading(true)
    const params = filter !== 'TODOS' ? { status: filter } : {}
    const { data } = await api.get('/tickets', { params })
    setTickets(data.tickets)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const handleDespachar = async () => {
    if (!cantidadDespachar || +cantidadDespachar <= 0) return toast.error('Ingresa una cantidad válida')
    try {
      const { data } = await api.post(`/tickets/${despachoModal.id}/despachar`, {
        cantidadDespachar: +cantidadDespachar, nota
      })
      toast.success(data.message)
      setDespachoModal(null)
      setCantidadDespachar('')
      setNota('')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error al despachar') }
  }

  const handleRechazar = async () => {
    try {
      await api.post(`/tickets/${rechazarModal.id}/rechazar`, { nota })
      toast.success('Ticket rechazado')
      setRechazarModal(null)
      setNota('')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
  }

  const pendingCount = tickets.filter(t => ['PENDIENTE','PARCIAL'].includes(t.status)).length

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="display text-3xl" style={{color:'#e8e8e8'}}>TICKETS DE SOLICITUD</div>
        <div className="mono text-xs mt-0.5" style={{color:'#444'}}>
          {pendingCount > 0 ? `${pendingCount} TICKET(S) REQUIEREN ATENCIÓN` : 'GESTIÓN DE SOLICITUDES'}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 mb-5 p-1 w-fit" style={{background:'#111', border:'1px solid #1a1a1a'}}>
        {['PENDIENTE','PARCIAL','DESPACHADO','RECHAZADO','TODOS'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="mono px-4 py-2 text-xs transition-all"
            style={{
              background: filter === f ? (statusColor[f] || '#f5a623') : 'transparent',
              color: filter === f ? '#000' : '#555',
              fontWeight: filter === f ? '700' : '400',
              letterSpacing: '0.08em'
            }}
          >{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? <div className="mono text-xs" style={{color:'#333'}}>CARGANDO...</div>
        : tickets.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="mono text-xs" style={{color:'#333'}}>NO HAY TICKETS {filter !== 'TODOS' ? `CON STATUS "${filter}"` : ''}</div>
          </div>
        ) : tickets.map(t => {
          const pendiente = t.cantidad - (t.cantidadDespachada || 0)
          const stockDisp = t.herramienta?.stockDisp || 0
          const puedeDespachar = ['PENDIENTE','PARCIAL'].includes(t.status)
          const puedePrint = ['DESPACHADO','PARCIAL'].includes(t.status)

          return (
            <div key={t.id} className="card p-5" style={{borderLeft:`2px solid ${statusColor[t.status]}`, background: statusBg[t.status]}}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="mono text-xs font-bold" style={{color:'#f5a623'}}>{t.folio}</span>
                    <span className="mono text-xs font-bold px-2 py-0.5"
                      style={{background: statusColor[t.status]+'20', color: statusColor[t.status], border:`1px solid ${statusColor[t.status]}40`}}>
                      {t.status}
                    </span>
                    <span className="mono text-xs" style={{color:'#444'}}>
                      {new Date(t.createdAt).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>MATERIAL</div>
                      <div className="text-sm font-medium" style={{color:'#e8e8e8'}}>{t.herramienta?.nombre}</div>
                      <div className="mono text-xs" style={{color:'#555'}}>{t.herramienta?.codigo}</div>
                    </div>
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>CANTIDAD</div>
                      <div className="display text-2xl" style={{color:'#f5a623'}}>{t.cantidad}</div>
                      <div className="mono text-xs" style={{color:'#555'}}>{t.herramienta?.unidad} solicitadas</div>
                    </div>
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>PROGRESO</div>
                      <div className="display text-2xl" style={{color: statusColor[t.status]}}>
                        {t.cantidadDespachada || 0}/{t.cantidad}
                      </div>
                      <div className="mono text-xs" style={{color:'#555'}}>
                        {pendiente > 0 ? `${pendiente} pendiente(s)` : 'completo'}
                      </div>
                    </div>
                  </div>

                  {t.cantidadDespachada > 0 && (
                    <div className="mb-3">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{background:'#2a2a2a'}}>
                        <div className="h-full rounded-full transition-all"
                          style={{width:`${(t.cantidadDespachada/t.cantidad)*100}%`, background: statusColor[t.status]}} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>SOLICITANTE</div>
                      <div className="text-sm" style={{color:'#e8e8e8'}}>{t.user?.nombre}</div>
                      <div className="mono text-xs" style={{color:'#555'}}>{t.user?.empleado} · {t.user?.role}</div>
                    </div>
                    <div>
                      <div className="mono text-xs mb-0.5" style={{color:'#444', fontSize:'10px'}}>MOTIVO / OPERADOR</div>
                      <div className="text-xs" style={{color:'#888'}}>
                        {t.motivo.includes('| Operador:') ? t.motivo.split('| Operador:')[0].trim() : t.motivo}
                      </div>
                      {t.motivo.includes('| Operador:') && (
                        <div className="mono text-xs mt-0.5" style={{color:'#f5a623'}}>
                          👷 {t.motivo.split('| Operador:')[1].trim()}
                        </div>
                      )}
                    </div>
                  </div>

                  {puedeDespachar && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="mono text-xs px-2 py-1"
                        style={{background:'#1a1a1a', color: stockDisp > 0 ? '#2ecc71' : '#e74c3c', border:`1px solid ${stockDisp > 0 ? '#2ecc7130' : '#e74c3c30'}`}}>
                        STOCK ACTUAL: {stockDisp} {t.herramienta?.unidad}
                      </div>
                      {stockDisp === 0 && (
                        <div className="flex items-center gap-1 mono text-xs" style={{color:'#e74c3c'}}>
                          <AlertTriangle size={11} /> SIN STOCK
                        </div>
                      )}
                    </div>
                  )}

                  {t.nota && (
                    <div className="mt-2 px-3 py-2 border-l-2" style={{borderColor: statusColor[t.status], background:'#0a0a0a'}}>
                      <div className="mono text-xs mb-0.5" style={{color:'#444'}}>NOTA:</div>
                      <div className="text-xs" style={{color:'#888'}}>{t.nota}</div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 min-w-fit">
                  {puedeDespachar && (
                    <>
                      <button
                        onClick={() => { setDespachoModal(t); setCantidadDespachar(String(Math.min(pendiente, stockDisp))) }}
                        disabled={stockDisp === 0}
                        className="flex items-center gap-2 px-4 py-2.5 mono text-xs font-bold"
                        style={{
                          background: stockDisp > 0 ? '#2ecc7120' : '#2a2a2a',
                          color: stockDisp > 0 ? '#2ecc71' : '#444',
                          border: `1px solid ${stockDisp > 0 ? '#2ecc7140' : '#2a2a2a'}`,
                          cursor: stockDisp === 0 ? 'not-allowed' : 'pointer'
                        }}>
                        <CheckCircle size={13} /> DESPACHAR
                      </button>
                      <button onClick={() => { setRechazarModal(t); setNota('') }}
                        className="flex items-center gap-2 px-4 py-2.5 mono text-xs font-bold"
                        style={{background:'#e74c3c20', color:'#e74c3c', border:'1px solid #e74c3c40'}}>
                        <XCircle size={13} /> RECHAZAR
                      </button>
                    </>
                  )}
                  {puedePrint && (
                    <button onClick={() => setPrintTicket(t)}
                      className="flex items-center gap-2 px-4 py-2.5 mono text-xs font-bold"
                      style={{background:'#f5a62320', color:'#f5a623', border:'1px solid #f5a62340'}}>
                      <Printer size={13} /> IMPRIMIR
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal despacho */}
      {despachoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.92)'}}>
          <div className="w-full max-w-sm card p-6">
            <div className="mb-4">
              <div className="display text-xl mb-1" style={{color:'#2ecc71'}}>DESPACHAR MATERIAL</div>
              <div className="mono text-xs" style={{color:'#555'}}>{despachoModal.folio} — {despachoModal.herramienta?.nombre}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                ['SOLICITADO', despachoModal.cantidad - (despachoModal.cantidadDespachada||0), '#f5a623'],
                ['EN STOCK', despachoModal.herramienta?.stockDisp, '#2ecc71'],
                ['YA DADO', despachoModal.cantidadDespachada||0, '#3b82f6'],
              ].map(([label, val, color]) => (
                <div key={label} className="p-3 text-center" style={{background:'#1a1a1a', border:'1px solid #2a2a2a'}}>
                  <div className="mono text-xs mb-1" style={{color:'#555', fontSize:'9px'}}>{label}</div>
                  <div className="display text-2xl" style={{color}}>{val}</div>
                  <div className="mono text-xs" style={{color:'#444'}}>{despachoModal.herramienta?.unidad}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>CANTIDAD A DESPACHAR</label>
                <input type="number" min="1"
                  max={Math.min(despachoModal.cantidad-(despachoModal.cantidadDespachada||0), despachoModal.herramienta?.stockDisp||0)}
                  className="input-field mono text-lg" value={cantidadDespachar}
                  onChange={e => setCantidadDespachar(e.target.value)} />
                {+cantidadDespachar < (despachoModal.cantidad-(despachoModal.cantidadDespachada||0)) && cantidadDespachar !== '' && (
                  <div className="mono text-xs mt-1" style={{color:'#3b82f6'}}>
                    ⚠ Parcial — quedarán {(despachoModal.cantidad-(despachoModal.cantidadDespachada||0)) - +cantidadDespachar} pendiente(s)
                  </div>
                )}
              </div>
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>NOTA (opcional)</label>
                <input className="input-field" value={nota} onChange={e => setNota(e.target.value)}
                  placeholder="Ej: Resto disponible el lunes..." />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setDespachoModal(null); setCantidadDespachar(''); setNota('') }}
                  className="btn-ghost flex-1 justify-center mono text-xs">CANCELAR</button>
                <button onClick={handleDespachar}
                  className="flex-1 justify-center display tracking-widest py-2 px-4 text-sm font-bold"
                  style={{background:'#2ecc71', color:'#000'}}>CONFIRMAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal rechazar */}
      {rechazarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.92)'}}>
          <div className="w-full max-w-sm card p-6">
            <div className="mb-4">
              <div className="display text-xl mb-1" style={{color:'#e74c3c'}}>RECHAZAR TICKET</div>
              <div className="mono text-xs" style={{color:'#555'}}>{rechazarModal.folio} — {rechazarModal.herramienta?.nombre}</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mono text-xs mb-1.5 block" style={{color:'#555', fontSize:'10px'}}>MOTIVO DEL RECHAZO</label>
                <textarea className="input-field h-20 resize-none" value={nota} onChange={e => setNota(e.target.value)}
                  placeholder="Ej: Sin stock, material en mantenimiento..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setRechazarModal(null); setNota('') }}
                  className="btn-ghost flex-1 justify-center mono text-xs">CANCELAR</button>
                <button onClick={handleRechazar}
                  className="flex-1 justify-center display tracking-widest py-2 px-4 text-sm font-bold"
                  style={{background:'#e74c3c', color:'#fff'}}>RECHAZAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal impresión */}
      {printTicket && (
        <TicketPrint
          ticket={printTicket}
          encargado={user?.nombre}
          onClose={() => setPrintTicket(null)}
        />
      )}
    </div>
  )
}