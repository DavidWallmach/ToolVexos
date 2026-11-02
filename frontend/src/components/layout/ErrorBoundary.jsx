import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { fallo: false }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  componentDidCatch(error) {
    console.error(error)
  }

  render() {
    if (!this.state.fallo) return this.props.children
    return (
      <PantallaMensaje titulo="Algo salió mal" detalle="La pantalla tuvo un error inesperado. Tus datos no se perdieron."
        accion="Recargar" onAccion={() => window.location.reload()} />
    )
  }
}

export function PantallaMensaje({ titulo, detalle, accion, onAccion }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="text-center max-w-sm" role="status">
        <div className="display text-3xl mb-2" style={{ color: 'var(--text)' }}>{titulo}</div>
        {detalle && <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>{detalle}</p>}
        {accion && <button onClick={onAccion} className="btn-accent">{accion}</button>}
      </div>
    </div>
  )
}
