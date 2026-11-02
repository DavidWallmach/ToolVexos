import { useEffect } from 'react'
import { CloudOff, Search, X } from 'lucide-react'

export function PageHeader({ titulo, subtitulo, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="display text-4xl" style={{ color: 'var(--text)' }}>{titulo}</h1>
        {subtitulo && <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{subtitulo}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function Segmentos({ opciones, valor, onCambio }) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg max-w-full" style={{ background: 'var(--surface)' }}>
      {opciones.map(o => (
        <button key={o.valor} type="button" onClick={() => onCambio(o.valor)} aria-pressed={valor === o.valor}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-[var(--text)]"
          style={valor === o.valor ? { background: 'var(--surface2)', color: 'var(--text)' } : { color: 'var(--muted)' }}>
          {o.etiqueta}
        </button>
      ))}
    </div>
  )
}

export function Modal({ titulo, subtitulo, onCerrar, children, ancho = 'max-w-md' }) {
  useEffect(() => {
    const alPresionar = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className={`card w-full ${ancho} rounded-b-none sm:rounded-b-[10px]`} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{titulo}</h2>
            {subtitulo && <p className="text-sm truncate" style={{ color: 'var(--muted)' }}>{subtitulo}</p>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="p-1.5 rounded-lg transition-colors hover:bg-[var(--hover)]" style={{ color: 'var(--text-2)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Campo({ etiqueta, ayuda, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>{etiqueta}</span>
      {children}
      {ayuda && <span className="block text-xs mt-1" style={{ color: 'var(--muted)' }}>{ayuda}</span>}
    </label>
  )
}

export function Buscador({ valor, onCambio, placeholder }) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
      <input className="input-field" style={{ paddingLeft: '2.25rem' }} aria-label={placeholder} placeholder={placeholder} value={valor} onChange={e => onCambio(e.target.value)} />
    </div>
  )
}

export function ErrorCarga({ que, onReintentar }) {
  return <EstadoVacio icono={CloudOff} titulo={`No se pudieron cargar ${que}`} detalle="Revisa tu conexión e intenta de nuevo." accion="Reintentar" onAccion={onReintentar} />
}

export function Cargando({ texto = 'Cargando...' }) {
  return <p className="text-sm" style={{ color: 'var(--muted)' }}>{texto}</p>
}

export function EstadoVacio({ icono: Icono, titulo, detalle, accion, onAccion }) {
  return (
    <div className="card p-10 text-center">
      {Icono && <Icono size={24} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />}
      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{titulo}</p>
      {detalle && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{detalle}</p>}
      {accion && <button type="button" onClick={onAccion} className="btn-ghost mt-4">{accion}</button>}
    </div>
  )
}
