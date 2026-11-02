import { useState } from 'react'
import { X } from 'lucide-react'

const leerCerrado = (key) => {
  try { return key ? localStorage.getItem(key) === 'true' : false } catch { return false }
}

// Con id, el botón de cerrar aparece y la decisión se recuerda en este navegador
export default function Banner({ id, variant = 'normal', message, height = '3rem', className = '', children }) {
  const key = id ? `banner-${id}` : null
  const [open, setOpen] = useState(() => !leerCerrado(key))

  if (!open) return null

  const cerrar = () => {
    setOpen(false)
    try { localStorage.setItem(key, 'true') } catch {}
  }

  return (
    <div id={id} style={{ minHeight: height, background: variant === 'rainbow' ? '#0a0a0a' : 'var(--surface2)', borderColor: 'var(--border)' }}
      className={`sticky top-0 z-30 flex items-center justify-center overflow-hidden border-b px-10 py-2 text-center text-sm font-medium ${className}`}>
      {variant === 'rainbow' && <div className="rainbow-banner-layer" />}
      <span className="relative" style={{ color: 'var(--text)' }}>{message || children}</span>
      {id && (
        <button type="button" aria-label="Cerrar aviso" onClick={cerrar}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 transition-colors hover:text-[#e8e8e8]" style={{ color: '#888' }}>
          <X size={16} />
        </button>
      )}
    </div>
  )
}
