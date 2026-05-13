import { useState } from 'react'
import { FileSpreadsheet, FileText, Calendar } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

// ─── Helpers ─────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '—'
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—'
const today = () => new Date().toLocaleDateString('es-MX').replace(/\//g, '-')

// ─── Excel loader ─────────────────────────────────────────────
const loadXLSX = () => import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')

// ─── PDF loader ───────────────────────────────────────────────
const loadJsPDF = async () => {
  if (window.jspdf) return window.jspdf.jsPDF
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
    s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
  return window.jspdf.jsPDF
}

const pdfBase = async (title, subtitle) => {
  const JsPDF = await loadJsPDF()
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  doc.setFillColor(15, 15, 15)
  doc.rect(0, 0, 280, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(245, 166, 35)
  doc.text('TOOL', 10, 14)
  doc.setTextColor(255, 255, 255)
  doc.text('CRIP', 28, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('SISTEMA DE GESTIÓN DE ALMACÉN', 10, 19)
  doc.setTextColor(245, 166, 35)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 100, 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text(subtitle, 100, 18)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 200, 12)
  return doc
}

const tableStyle = {
  headStyles: { fillColor: [26, 26, 26], textColor: [245, 166, 35], fontStyle: 'bold', fontSize: 8 },
  bodyStyles: { fillColor: [17, 17, 17], textColor: [200, 200, 200], fontSize: 7 },
  alternateRowStyles: { fillColor: [22, 22, 22] },
  styles: { cellPadding: 2 },
  startY: 26,
}

// ─── Filtrar por fechas ───────────────────────────────────────
const filtrarPorFecha = (items, campo, desde, hasta) => {
  let result = items
  if (desde) result = result.filter(i => new Date(i[campo]) >= new Date(desde))
  if (hasta) result = result.filter(i => new Date(i[campo]) <= new Date(hasta + 'T23:59:59'))
  return result
}

// ─── Exportadores ─────────────────────────────────────────────
const exportInventarioExcel = async () => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/herramientas')
  const rows = data.herramientas.map(h => ({
    'CÓDIGO': h.codigo, 'NOMBRE': h.nombre, 'DESCRIPCIÓN': h.descripcion || '',
    'CATEGORÍA': h.categoria?.nombre || '', 'STOCK DISPONIBLE': h.stockDisp,
    'STOCK TOTAL': h.stockTotal, 'STOCK MÍNIMO': h.stockMin,
    'UNIDAD': h.unidad, 'UBICACIÓN': h.ubicacion_texto || '', 'STATUS': h.status,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [10,30,25,18,16,12,12,8,15,12].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  XLSX.writeFile(wb, `Inventario_${today()}.xlsx`)
  toast.success('Excel de inventario descargado')
}

const exportInventarioPDF = async () => {
  const { data } = await api.get('/herramientas')
  const doc = await pdfBase('REPORTE DE INVENTARIO', `Total: ${data.herramientas.length} herramientas`)
  doc.autoTable({
    ...tableStyle,
    head: [['CÓDIGO','NOMBRE','CATEGORÍA','STOCK DISP.','STOCK TOTAL','MÍN.','UNIDAD','UBICACIÓN','STATUS']],
    body: data.herramientas.map(h => [
      h.codigo, h.nombre, h.categoria?.nombre || '—',
      h.stockDisp, h.stockTotal, h.stockMin,
      h.unidad, h.ubicacion_texto || '—', h.status
    ]),
  })
  doc.save(`Inventario_${today()}.pdf`)
  toast.success('PDF de inventario descargado')
}

const exportMovimientosExcel = async (desde, hasta) => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/movimientos')
  const movs = filtrarPorFecha(data.movimientos, 'createdAt', desde, hasta)
  const rows = movs.map(m => ({
    'FECHA': fmtDateTime(m.createdAt), 'HERRAMIENTA': m.herramienta?.nombre || '',
    'CÓDIGO': m.herramienta?.codigo || '', 'TIPO': m.tipo, 'CANTIDAD': m.cantidad,
    'STOCK ANTES': m.stockAntes, 'STOCK DESPUÉS': m.stockDespues,
    'USUARIO': m.user?.nombre || '', 'NOTA': m.nota || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [18,30,12,12,10,12,12,20,30].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
  XLSX.writeFile(wb, `Movimientos_${today()}.xlsx`)
  toast.success(`Excel de movimientos — ${movs.length} registros`)
}

const exportMovimientosPDF = async (desde, hasta) => {
  const { data } = await api.get('/movimientos')
  const movs = filtrarPorFecha(data.movimientos, 'createdAt', desde, hasta)
  const rango = desde ? `Del ${fmtDate(desde)} al ${fmtDate(hasta || new Date())}` : 'Todos los registros'
  const doc = await pdfBase('HISTORIAL DE MOVIMIENTOS', `${movs.length} registros | ${rango}`)
  doc.autoTable({
    ...tableStyle,
    head: [['FECHA','HERRAMIENTA','CÓDIGO','TIPO','CANT.','STOCK ANT.','STOCK NVO.','USUARIO','NOTA']],
    body: movs.map(m => [
      fmtDateTime(m.createdAt), m.herramienta?.nombre || '—', m.herramienta?.codigo || '—',
      m.tipo, m.cantidad, m.stockAntes, m.stockDespues, m.user?.nombre || '—', m.nota || '—'
    ]),
  })
  doc.save(`Movimientos_${today()}.pdf`)
  toast.success(`PDF de movimientos — ${movs.length} registros`)
}

const exportTicketsExcel = async (desde, hasta, statusFiltro) => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/tickets')
  let tickets = filtrarPorFecha(data.tickets, 'createdAt', desde, hasta)
  if (statusFiltro !== 'TODOS') tickets = tickets.filter(t => t.status === statusFiltro)
  const rows = tickets.map(t => {
    const operador = t.motivo.includes('| Operador:') ? t.motivo.split('| Operador:')[1].trim() : '—'
    const motivo = t.motivo.includes('| Operador:') ? t.motivo.split('| Operador:')[0].trim() : t.motivo
    return {
      'FOLIO': t.folio, 'FECHA': fmtDateTime(t.createdAt),
      'MATERIAL': t.herramienta?.nombre || '', 'CÓDIGO': t.herramienta?.codigo || '',
      'SOLICITANTE': t.user?.nombre || '', 'EMPLEADO': t.user?.empleado || '',
      'ROL': t.user?.role || '', 'OPERADOR': operador,
      'CANTIDAD SOLICITADA': t.cantidad, 'CANTIDAD DESPACHADA': t.cantidadDespachada || 0,
      'UNIDAD': t.herramienta?.unidad || '', 'MOTIVO': motivo,
      'STATUS': t.status, 'NOTA': t.nota || '',
    }
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [14,18,28,10,22,12,12,20,16,16,8,30,12,25].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tickets')
  XLSX.writeFile(wb, `Tickets_${today()}.xlsx`)
  toast.success(`Excel de tickets — ${tickets.length} registros`)
}

const exportTicketsPDF = async (desde, hasta, statusFiltro) => {
  const { data } = await api.get('/tickets')
  let tickets = filtrarPorFecha(data.tickets, 'createdAt', desde, hasta)
  if (statusFiltro !== 'TODOS') tickets = tickets.filter(t => t.status === statusFiltro)
  const rango = desde ? `Del ${fmtDate(desde)} al ${fmtDate(hasta || new Date())}` : 'Todos los registros'
  const doc = await pdfBase('REPORTE DE TICKETS', `${tickets.length} tickets | ${rango} | Status: ${statusFiltro}`)
  doc.autoTable({
    ...tableStyle,
    head: [['FOLIO','FECHA','MATERIAL','SOLICITANTE','OPERADOR','SOLICITADO','DESPACHADO','STATUS','NOTA']],
    body: tickets.map(t => {
      const operador = t.motivo.includes('| Operador:') ? t.motivo.split('| Operador:')[1].trim() : '—'
      return [
        t.folio, fmtDateTime(t.createdAt), t.herramienta?.nombre || '—',
        `${t.user?.nombre || '—'} (${t.user?.empleado || ''})`, operador,
        `${t.cantidad} ${t.herramienta?.unidad || ''}`,
        `${t.cantidadDespachada || 0} ${t.herramienta?.unidad || ''}`,
        t.status, t.nota || '—'
      ]
    }),
  })
  doc.save(`Tickets_${today()}.pdf`)
  toast.success(`PDF de tickets — ${tickets.length} registros`)
}

const exportSalidasExcel = async (desde, hasta) => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/salidas')
  const salidas = filtrarPorFecha(data.salidas, 'createdAt', desde, hasta)
  const rows = salidas.map(s => ({
    'FECHA': fmtDateTime(s.createdAt), 'HERRAMIENTA': s.herramienta?.nombre || '',
    'CÓDIGO': s.herramienta?.codigo || '', 'CANTIDAD': s.cantidad,
    'UNIDAD': s.herramienta?.unidad || '', 'SOLICITANTE': s.solicitante,
    'DEPARTAMENTO': s.departamento || '', 'PROPÓSITO': s.proposito || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [18,30,12,10,8,25,20,30].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Salidas')
  XLSX.writeFile(wb, `Salidas_${today()}.xlsx`)
  toast.success(`Excel de salidas — ${salidas.length} registros`)
}

const exportSalidasPDF = async (desde, hasta) => {
  const { data } = await api.get('/salidas')
  const salidas = filtrarPorFecha(data.salidas, 'createdAt', desde, hasta)
  const rango = desde ? `Del ${fmtDate(desde)} al ${fmtDate(hasta || new Date())}` : 'Todos'
  const doc = await pdfBase('REPORTE DE SALIDAS POR PERSONA', `${salidas.length} salidas | ${rango}`)
  const grouped = {}
  salidas.forEach(s => {
    if (!grouped[s.solicitante]) grouped[s.solicitante] = []
    grouped[s.solicitante].push(s)
  })
  let y = 26
  Object.entries(grouped).forEach(([nombre, items]) => {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.setTextColor(245, 166, 35)
    doc.text(`▸ ${nombre} — ${items[0]?.departamento || 'Sin departamento'} (${items.length} salidas)`, 10, y)
    y += 2
    doc.autoTable({
      ...tableStyle, startY: y, margin: { left: 10 },
      head: [['FECHA','HERRAMIENTA','CÓDIGO','CANTIDAD','PROPÓSITO']],
      body: items.map(s => [fmtDateTime(s.createdAt), s.herramienta?.nombre || '—', s.herramienta?.codigo || '—', `${s.cantidad} ${s.herramienta?.unidad || ''}`, s.proposito || '—']),
    })
    y = doc.lastAutoTable.finalY + 8
  })
  doc.save(`Salidas_${today()}.pdf`)
  toast.success(`PDF de salidas — ${salidas.length} registros`)
}

const exportAlertasExcel = async () => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/herramientas')
  const alertas = data.herramientas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA')
  const rows = alertas.map(h => ({
    'CÓDIGO': h.codigo, 'NOMBRE': h.nombre, 'CATEGORÍA': h.categoria?.nombre || '',
    'STOCK DISPONIBLE': h.stockDisp, 'STOCK MÍNIMO': h.stockMin,
    'UNIDAD': h.unidad, 'UBICACIÓN': h.ubicacion_texto || '',
    'STATUS': h.status, 'URGENCIA': h.stockDisp === 0 ? 'AGOTADO' : 'STOCK BAJO',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [12,30,20,16,14,8,18,14,12].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alertas')
  XLSX.writeFile(wb, `Alertas_${today()}.xlsx`)
  toast.success('Excel de alertas descargado')
}

const exportAlertasPDF = async () => {
  const { data } = await api.get('/herramientas')
  const alertas = data.herramientas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA')
  const doc = await pdfBase('ALERTAS DE STOCK', `${alertas.length} materiales requieren atención`)
  doc.autoTable({
    ...tableStyle,
    head: [['CÓDIGO','NOMBRE','CATEGORÍA','STOCK DISP.','STOCK MÍN.','UNIDAD','UBICACIÓN','URGENCIA']],
    body: alertas.map(h => [
      h.codigo, h.nombre, h.categoria?.nombre || '—',
      h.stockDisp, h.stockMin, h.unidad, h.ubicacion_texto || '—',
      h.stockDisp === 0 ? 'AGOTADO' : 'STOCK BAJO'
    ]),
  })
  doc.save(`Alertas_${today()}.pdf`)
  toast.success('PDF de alertas descargado')
}

// ─── Componente de filtro de fechas ───────────────────────────
function DateFilter({ desde, hasta, onDesde, onHasta, shortcuts }) {
  const setRango = (dias) => {
    const h = new Date()
    const d = new Date()
    d.setDate(d.getDate() - dias)
    onDesde(d.toISOString().split('T')[0])
    onHasta(h.toISOString().split('T')[0])
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Accesos rápidos */}
      <div className="flex gap-1 flex-wrap">
        <button onClick={() => { onDesde(''); onHasta('') }}
          className="mono text-xs px-2 py-1 transition-colors"
          style={{background: !desde ? '#f5a62320' : '#1a1a1a', color: !desde ? '#f5a623' : '#444', border:`1px solid ${!desde ? '#f5a62340' : '#2a2a2a'}`}}>
          TODO
        </button>
        {[['HOY', 0],['7 DÍAS', 7],['15 DÍAS', 15],['30 DÍAS', 30],['90 DÍAS', 90]].map(([label, dias]) => (
          <button key={label} onClick={() => setRango(dias)}
            className="mono text-xs px-2 py-1 transition-colors"
            style={{background:'#1a1a1a', color:'#555', border:'1px solid #2a2a2a'}}>
            {label}
          </button>
        ))}
      </div>
      {/* Fechas personalizadas */}
      <div className="flex gap-2 items-center">
        <Calendar size={12} style={{color:'#444'}} />
        <input type="date" className="input-field mono py-1" style={{width:'140px', fontSize:'11px'}}
          value={desde} onChange={e => onDesde(e.target.value)} />
        <span className="mono text-xs" style={{color:'#444'}}>→</span>
        <input type="date" className="input-field mono py-1" style={{width:'140px', fontSize:'11px'}}
          value={hasta} onChange={e => onHasta(e.target.value)} />
        {desde && (
          <span className="mono text-xs" style={{color:'#f5a623'}}>
            {desde === hasta ? fmtDate(desde) : `${fmtDate(desde)} — ${fmtDate(hasta)}`}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function ReportesPage() {
  const [loading, setLoading] = useState({})

  // Filtros por reporte
  const [movDesde, setMovDesde] = useState('')
  const [movHasta, setMovHasta] = useState('')
  const [tkDesde, setTkDesde] = useState('')
  const [tkHasta, setTkHasta] = useState('')
  const [tkStatus, setTkStatus] = useState('TODOS')
  const [salDesde, setSalDesde] = useState('')
  const [salHasta, setSalHasta] = useState('')

  const run = async (id, fn) => {
    setLoading(l => ({...l, [id]: true}))
    try { await fn() }
    catch { toast.error('Error al generar reporte') }
    finally { setLoading(l => ({...l, [id]: false})) }
  }

  const statusOptions = ['TODOS','PENDIENTE','PARCIAL','DESPACHADO','RECHAZADO']

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="display text-3xl" style={{color:'#e8e8e8'}}>REPORTES</div>
        <div className="mono text-xs mt-0.5" style={{color:'#444'}}>EXPORTAR DATOS EN EXCEL Y PDF CON FILTROS DE FECHA</div>
      </div>

      <div className="space-y-4">

        {/* Inventario */}
        <ReporteCard
          title="INVENTARIO COMPLETO" color="#f5a623"
          desc="Todas las herramientas con stock, categoría y ubicación — sin filtro de fecha"
          loading={loading}
          onExcel={() => run('inv-excel', exportInventarioExcel)}
          onPDF={() => run('inv-pdf', exportInventarioPDF)}
          idExcel="inv-excel" idPDF="inv-pdf"
        />

        {/* Movimientos con fecha */}
        <div className="card p-5" style={{borderLeft:'2px solid #3b82f6'}}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="display text-lg mb-0.5" style={{color:'#3b82f6'}}>MOVIMIENTOS</div>
              <div className="mono text-xs" style={{color:'#555'}}>Entradas, salidas y ajustes de stock</div>
              <DateFilter desde={movDesde} hasta={movHasta} onDesde={setMovDesde} onHasta={setMovHasta} />
            </div>
            <BtnsExportPDF
              loading={loading} idExcel="mov-excel" idPDF="mov-pdf"
              onExcel={() => run('mov-excel', () => exportMovimientosExcel(movDesde, movHasta))}
              onPDF={() => run('mov-pdf', () => exportMovimientosPDF(movDesde, movHasta))}
            />
          </div>
        </div>

        {/* Tickets con fecha y status */}
        <div className="card p-5" style={{borderLeft:'2px solid #f5a623'}}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="display text-lg mb-0.5" style={{color:'#f5a623'}}>TICKETS DE SOLICITUD</div>
              <div className="mono text-xs" style={{color:'#555'}}>Solicitudes de material por supervisores y jefes</div>
              <DateFilter desde={tkDesde} hasta={tkHasta} onDesde={setTkDesde} onHasta={setTkHasta} />
              {/* Filtro de status */}
              <div className="flex gap-1 mt-2 flex-wrap">
                {statusOptions.map(s => (
                  <button key={s} onClick={() => setTkStatus(s)}
                    className="mono text-xs px-2 py-1 transition-colors"
                    style={{
                      background: tkStatus === s ? '#f5a62320' : '#1a1a1a',
                      color: tkStatus === s ? '#f5a623' : '#444',
                      border: `1px solid ${tkStatus === s ? '#f5a62340' : '#2a2a2a'}`
                    }}>{s}</button>
                ))}
              </div>
            </div>
            <BtnsExportPDF
              loading={loading} idExcel="tk-excel" idPDF="tk-pdf"
              onExcel={() => run('tk-excel', () => exportTicketsExcel(tkDesde, tkHasta, tkStatus))}
              onPDF={() => run('tk-pdf', () => exportTicketsPDF(tkDesde, tkHasta, tkStatus))}
            />
          </div>
        </div>

        {/* Salidas por persona con fecha */}
        <div className="card p-5" style={{borderLeft:'2px solid #2ecc71'}}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="display text-lg mb-0.5" style={{color:'#2ecc71'}}>SALIDAS POR PERSONA</div>
              <div className="mono text-xs" style={{color:'#555'}}>Material entregado agrupado por solicitante</div>
              <DateFilter desde={salDesde} hasta={salHasta} onDesde={setSalDesde} onHasta={setSalHasta} />
            </div>
            <BtnsExportPDF
              loading={loading} idExcel="sal-excel" idPDF="sal-pdf"
              onExcel={() => run('sal-excel', () => exportSalidasExcel(salDesde, salHasta))}
              onPDF={() => run('sal-pdf', () => exportSalidasPDF(salDesde, salHasta))}
            />
          </div>
        </div>

        {/* Alertas */}
        <ReporteCard
          title="ALERTAS DE STOCK" color="#e74c3c"
          desc="Materiales agotados y con stock bajo — estado actual"
          loading={loading}
          onExcel={() => run('alt-excel', exportAlertasExcel)}
          onPDF={() => run('alt-pdf', exportAlertasPDF)}
          idExcel="alt-excel" idPDF="alt-pdf"
        />
      </div>

      <div className="mt-6 px-4 py-3 border" style={{borderColor:'#2a2a2a', background:'#111'}}>
        <div className="mono text-xs" style={{color:'#444'}}>
          💡 Los botones de acceso rápido (HOY, 7 DÍAS, etc.) aplican el rango automáticamente. Los PDFs usan membrete TOOLCRIP en negro/naranja.
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────
function ReporteCard({ title, color, desc, loading, onExcel, onPDF, idExcel, idPDF }) {
  return (
    <div className="card p-5" style={{borderLeft:`2px solid ${color}`}}>
      <div className="flex items-center justify-between">
        <div>
          <div className="display text-lg mb-0.5" style={{color}}>{title}</div>
          <div className="mono text-xs" style={{color:'#555'}}>{desc}</div>
        </div>
        <BtnsExportPDF loading={loading} idExcel={idExcel} idPDF={idPDF} onExcel={onExcel} onPDF={onPDF} />
      </div>
    </div>
  )
}

function BtnsExportPDF({ loading, idExcel, idPDF, onExcel, onPDF }) {
  return (
    <div className="flex gap-2 ml-4 flex-shrink-0">
      <button onClick={onExcel} disabled={loading[idExcel]}
        className="btn-ghost flex items-center gap-2 px-4 py-2.5"
        style={{borderColor:'#2ecc7150', color:'#2ecc71'}}>
        <FileSpreadsheet size={15} />
        <span className="mono" style={{fontSize:'11px'}}>{loading[idExcel] ? 'GENERANDO...' : 'EXCEL'}</span>
      </button>
      <button onClick={onPDF} disabled={loading[idPDF]}
        className="btn-ghost flex items-center gap-2 px-4 py-2.5"
        style={{borderColor:'#e74c3c50', color:'#e74c3c'}}>
        <FileText size={15} />
        <span className="mono" style={{fontSize:'11px'}}>{loading[idPDF] ? 'GENERANDO...' : 'PDF'}</span>
      </button>
    </div>
  )
}
