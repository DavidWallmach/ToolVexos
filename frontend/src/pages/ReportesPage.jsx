import { useState } from 'react'
import { FileSpreadsheet, FileText, Download, Calendar, Filter } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

// ─── Utilidades Excel (SheetJS via CDN) ──────────────────────
const loadXLSX = () => import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')

// ─── Utilidades PDF (jsPDF via CDN) ──────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : '—'
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—'
const today = () => new Date().toLocaleDateString('es-MX')

const pdfBase = async (title, subtitle) => {
  const JsPDF = await loadJsPDF()
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  // Header
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
  doc.text(`Generado: ${today()}`, 220, 12)

  return doc
}

const tableStyle = {
  headStyles: { fillColor: [26, 26, 26], textColor: [245, 166, 35], fontStyle: 'bold', fontSize: 8 },
  bodyStyles: { fillColor: [17, 17, 17], textColor: [200, 200, 200], fontSize: 7 },
  alternateRowStyles: { fillColor: [22, 22, 22] },
  styles: { cellPadding: 2 },
  startY: 26,
}

// ─── Exportadores ─────────────────────────────────────────────

const exportInventarioExcel = async () => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/herramientas')
  const rows = data.herramientas.map(h => ({
    'CÓDIGO': h.codigo,
    'NOMBRE': h.nombre,
    'DESCRIPCIÓN': h.descripcion || '',
    'CATEGORÍA': h.categoria?.nombre || '',
    'STOCK DISPONIBLE': h.stockDisp,
    'STOCK TOTAL': h.stockTotal,
    'STOCK MÍNIMO': h.stockMin,
    'UNIDAD': h.unidad,
    'UBICACIÓN': h.ubicacion_texto || '',
    'STATUS': h.status,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [10,30,25,18,16,12,12,8,15,12].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  XLSX.writeFile(wb, `Inventario_${today().replace(/\//g,'-')}.xlsx`)
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
    columnStyles: { 0:{cellWidth:18}, 1:{cellWidth:50}, 2:{cellWidth:28}, 3:{cellWidth:20}, 4:{cellWidth:20}, 5:{cellWidth:15}, 6:{cellWidth:15}, 7:{cellWidth:28}, 8:{cellWidth:24} }
  })
  doc.save(`Inventario_${today().replace(/\//g,'-')}.pdf`)
  toast.success('PDF de inventario descargado')
}

const exportMovimientosExcel = async (desde, hasta) => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/movimientos')
  let movs = data.movimientos
  if (desde) movs = movs.filter(m => new Date(m.createdAt) >= new Date(desde))
  if (hasta) movs = movs.filter(m => new Date(m.createdAt) <= new Date(hasta + 'T23:59:59'))
  const rows = movs.map(m => ({
    'FECHA': fmtDateTime(m.createdAt),
    'HERRAMIENTA': m.herramienta?.nombre || '',
    'CÓDIGO': m.herramienta?.codigo || '',
    'TIPO': m.tipo,
    'CANTIDAD': m.cantidad,
    'STOCK ANTES': m.stockAntes,
    'STOCK DESPUÉS': m.stockDespues,
    'USUARIO': m.user?.nombre || '',
    'NOTA': m.nota || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [18,30,12,12,10,12,12,20,30].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
  XLSX.writeFile(wb, `Movimientos_${today().replace(/\//g,'-')}.xlsx`)
  toast.success('Excel de movimientos descargado')
}

const exportMovimientosPDF = async (desde, hasta) => {
  const { data } = await api.get('/movimientos')
  let movs = data.movimientos
  if (desde) movs = movs.filter(m => new Date(m.createdAt) >= new Date(desde))
  if (hasta) movs = movs.filter(m => new Date(m.createdAt) <= new Date(hasta + 'T23:59:59'))
  const doc = await pdfBase('HISTORIAL DE MOVIMIENTOS', `${movs.length} registros${desde ? ` | Del ${fmtDate(desde)} al ${fmtDate(hasta || new Date())}` : ''}`)
  doc.autoTable({
    ...tableStyle,
    head: [['FECHA','HERRAMIENTA','CÓDIGO','TIPO','CANT.','STOCK ANT.','STOCK NVO.','USUARIO','NOTA']],
    body: movs.map(m => [
      fmtDateTime(m.createdAt), m.herramienta?.nombre || '—', m.herramienta?.codigo || '—',
      m.tipo, m.cantidad, m.stockAntes, m.stockDespues, m.user?.nombre || '—', m.nota || '—'
    ]),
  })
  doc.save(`Movimientos_${today().replace(/\//g,'-')}.pdf`)
  toast.success('PDF de movimientos descargado')
}

const exportPrestamosExcel = async () => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/prestamos')
  const rows = data.prestamos.map(p => ({
    'FOLIO': p.folio,
    'HERRAMIENTA': p.herramienta?.nombre || '',
    'CÓDIGO': p.herramienta?.codigo || '',
    'SOLICITANTE': p.user?.nombre || '',
    'EMPLEADO': p.user?.empleado || '',
    'CANTIDAD': p.cantidad,
    'UNIDAD': p.herramienta?.unidad || '',
    'MOTIVO': p.motivo || '',
    'FECHA SALIDA': fmtDateTime(p.fechaSalida),
    'RETORNO EST.': fmtDate(p.fechaRetorno),
    'FECHA DEVUELTO': fmtDate(p.fechaDevuelto),
    'STATUS': p.status,
    'OBSERVACIONES': p.observaciones || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [14,30,12,25,12,10,8,20,18,14,14,12,25].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Préstamos')
  XLSX.writeFile(wb, `Prestamos_${today().replace(/\//g,'-')}.xlsx`)
  toast.success('Excel de préstamos descargado')
}

const exportPrestamosPDF = async () => {
  const { data } = await api.get('/prestamos')
  const activos = data.prestamos.filter(p => p.status === 'ACTIVO').length
  const doc = await pdfBase('REPORTE DE PRÉSTAMOS', `Total: ${data.prestamos.length} | Activos: ${activos}`)
  doc.autoTable({
    ...tableStyle,
    head: [['FOLIO','HERRAMIENTA','SOLICITANTE','CANT.','SALIDA','RETORNO EST.','DEVUELTO','STATUS']],
    body: data.prestamos.map(p => [
      p.folio, p.herramienta?.nombre || '—', `${p.user?.nombre || '—'} (${p.user?.empleado || ''})`,
      `${p.cantidad} ${p.herramienta?.unidad || ''}`,
      fmtDateTime(p.fechaSalida), fmtDate(p.fechaRetorno),
      fmtDate(p.fechaDevuelto), p.status
    ]),
  })
  doc.save(`Prestamos_${today().replace(/\//g,'-')}.pdf`)
  toast.success('PDF de préstamos descargado')
}

const exportSalidasExcel = async () => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/salidas')
  const rows = data.salidas.map(s => ({
    'FECHA': fmtDateTime(s.createdAt),
    'HERRAMIENTA': s.herramienta?.nombre || '',
    'CÓDIGO': s.herramienta?.codigo || '',
    'CANTIDAD': s.cantidad,
    'UNIDAD': s.herramienta?.unidad || '',
    'SOLICITANTE': s.solicitante,
    'DEPARTAMENTO': s.departamento || '',
    'PROPÓSITO': s.proposito || '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [18,30,12,10,8,25,20,30].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Salidas')
  XLSX.writeFile(wb, `Salidas_${today().replace(/\//g,'-')}.xlsx`)
  toast.success('Excel de salidas descargado')
}

const exportSalidasPDF = async () => {
  const { data } = await api.get('/salidas')
  const doc = await pdfBase('REPORTE DE SALIDAS POR PERSONA', `Total: ${data.salidas.length} salidas registradas`)
  // Agrupar por solicitante
  const grouped = {}
  data.salidas.forEach(s => {
    if (!grouped[s.solicitante]) grouped[s.solicitante] = []
    grouped[s.solicitante].push(s)
  })
  let y = 26
  Object.entries(grouped).forEach(([nombre, salidas]) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(245, 166, 35)
    doc.text(`▸ ${nombre} — ${salidas[0]?.departamento || 'Sin departamento'} (${salidas.length} salidas)`, 10, y)
    y += 2
    doc.autoTable({
      ...tableStyle,
      startY: y,
      head: [['FECHA','HERRAMIENTA','CÓDIGO','CANTIDAD','PROPÓSITO']],
      body: salidas.map(s => [fmtDateTime(s.createdAt), s.herramienta?.nombre || '—', s.herramienta?.codigo || '—', `${s.cantidad} ${s.herramienta?.unidad || ''}`, s.proposito || '—']),
      margin: { left: 10 },
    })
    y = doc.lastAutoTable.finalY + 8
  })
  doc.save(`Salidas_por_persona_${today().replace(/\//g,'-')}.pdf`)
  toast.success('PDF de salidas descargado')
}

const exportAlertasExcel = async () => {
  const XLSX = await loadXLSX()
  const { data } = await api.get('/herramientas')
  const alertas = data.herramientas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA')
  const rows = alertas.map(h => ({
    'CÓDIGO': h.codigo,
    'NOMBRE': h.nombre,
    'CATEGORÍA': h.categoria?.nombre || '',
    'STOCK DISPONIBLE': h.stockDisp,
    'STOCK MÍNIMO': h.stockMin,
    'UNIDAD': h.unidad,
    'UBICACIÓN': h.ubicacion_texto || '',
    'STATUS': h.status,
    'URGENCIA': h.stockDisp === 0 ? 'AGOTADO' : 'STOCK BAJO',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [12,30,20,16,14,8,18,14,12].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alertas')
  XLSX.writeFile(wb, `Alertas_${today().replace(/\//g,'-')}.xlsx`)
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
      h.stockDisp, h.stockMin, h.unidad,
      h.ubicacion_texto || '—',
      h.stockDisp === 0 ? 'AGOTADO' : 'STOCK BAJO'
    ]),
    didDrawCell: (data) => {
      if (data.column.index === 7 && data.section === 'body') {
        const isAgotado = data.cell.raw === 'AGOTADO'
        data.cell.styles.textColor = isAgotado ? [231, 76, 60] : [245, 166, 35]
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })
  doc.save(`Alertas_${today().replace(/\//g,'-')}.pdf`)
  toast.success('PDF de alertas descargado')
}

// ─── Componente principal ─────────────────────────────────────

const reportes = [
  {
    id: 'inventario',
    title: 'INVENTARIO COMPLETO',
    desc: 'Todas las herramientas con stock, categoría y ubicación',
    color: '#f5a623',
    onExcel: exportInventarioExcel,
    onPDF: exportInventarioPDF,
    hasFilter: false,
  },
  {
    id: 'movimientos',
    title: 'MOVIMIENTOS',
    desc: 'Entradas, salidas y ajustes de stock por fecha',
    color: '#3b82f6',
    hasFilter: true,
  },
  {
    id: 'prestamos',
    title: 'PRÉSTAMOS',
    desc: 'Préstamos activos y devueltos con folios',
    color: '#8b5cf6',
    onExcel: exportPrestamosExcel,
    onPDF: exportPrestamosPDF,
    hasFilter: false,
  },
  {
    id: 'salidas',
    title: 'SALIDAS POR PERSONA',
    desc: 'Material entregado agrupado por solicitante y departamento',
    color: '#2ecc71',
    onExcel: exportSalidasExcel,
    onPDF: exportSalidasPDF,
    hasFilter: false,
  },
  {
    id: 'alertas',
    title: 'ALERTAS DE STOCK',
    desc: 'Materiales agotados y con stock bajo',
    color: '#e74c3c',
    onExcel: exportAlertasExcel,
    onPDF: exportAlertasPDF,
    hasFilter: false,
  },
]

export default function ReportesPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [loading, setLoading] = useState({})

  const run = async (id, fn) => {
    setLoading(l => ({...l, [id]: true}))
    try { await fn() }
    catch (err) { toast.error('Error al generar reporte') }
    finally { setLoading(l => ({...l, [id]: false})) }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="display text-3xl" style={{color:'#e8e8e8'}}>REPORTES</div>
        <div className="mono text-xs mt-0.5" style={{color:'#444'}}>EXPORTAR DATOS EN EXCEL Y PDF</div>
      </div>

      <div className="space-y-4">
        {reportes.map(r => (
          <div key={r.id} className="card p-5" style={{borderLeft:`2px solid ${r.color}`}}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="display text-lg mb-0.5" style={{color: r.color}}>{r.title}</div>
                <div className="mono text-xs" style={{color:'#555'}}>{r.desc}</div>

                {/* Filtro de fechas para movimientos */}
                {r.hasFilter && (
                  <div className="flex gap-3 mt-3">
                    <div>
                      <label className="mono block mb-1" style={{color:'#444', fontSize:'10px'}}>DESDE</label>
                      <input type="date" className="input-field mono py-1.5" style={{width:'160px'}}
                        value={desde} onChange={e => setDesde(e.target.value)} />
                    </div>
                    <div>
                      <label className="mono block mb-1" style={{color:'#444', fontSize:'10px'}}>HASTA</label>
                      <input type="date" className="input-field mono py-1.5" style={{width:'160px'}}
                        value={hasta} onChange={e => setHasta(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-6">
                <button
                  onClick={() => run(`${r.id}-excel`, r.hasFilter
                    ? () => exportMovimientosExcel(desde, hasta)
                    : r.onExcel)}
                  disabled={loading[`${r.id}-excel`]}
                  className="btn-ghost flex items-center gap-2 px-4 py-2.5"
                  style={{borderColor:'#2ecc7150', color:'#2ecc71'}}
                >
                  <FileSpreadsheet size={15} />
                  <span className="mono" style={{fontSize:'11px'}}>
                    {loading[`${r.id}-excel`] ? 'GENERANDO...' : 'EXCEL'}
                  </span>
                </button>
                <button
                  onClick={() => run(`${r.id}-pdf`, r.hasFilter
                    ? () => exportMovimientosPDF(desde, hasta)
                    : r.onPDF)}
                  disabled={loading[`${r.id}-pdf`]}
                  className="btn-ghost flex items-center gap-2 px-4 py-2.5"
                  style={{borderColor:'#e74c3c50', color:'#e74c3c'}}
                >
                  <FileText size={15} />
                  <span className="mono" style={{fontSize:'11px'}}>
                    {loading[`${r.id}-pdf`] ? 'GENERANDO...' : 'PDF'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 px-4 py-3 border" style={{borderColor:'#2a2a2a', background:'#111'}}>
        <div className="mono text-xs" style={{color:'#444'}}>
          💡 Los reportes se generan con los datos actuales del sistema. El PDF usa formato carta horizontal con el membrete de TOOLCRIP.
        </div>
      </div>
    </div>
  )
}
