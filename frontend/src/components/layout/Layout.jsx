import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, PackagePlus, PackageMinus, Activity, LogOut, Bell, MapPin, UserCheck, BarChart2, Ticket, Menu, X, Users } from 'lucide-react'
import useAuthStore from '../../hooks/useAuth'
import { useState, useEffect } from 'react'
import api from '../../lib/api'
import useNotificaciones from '../../hooks/useNotificaciones.jsx'

const navEncargado = [
  { items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  { titulo: 'Operación', items: [
    { to: '/app/tickets', label: 'Tickets', icon: Ticket, badge: 'tickets' },
    { to: '/app/entradas', label: 'Entradas', icon: PackagePlus },
    { to: '/app/salidas', label: 'Salidas', icon: PackageMinus },
    { to: '/app/movimientos', label: 'Movimientos', icon: Activity },
  ] },
  { titulo: 'Almacén', items: [
    { to: '/app/inventario', label: 'Materiales', icon: Package },
    { to: '/app/alertas', label: 'Alertas', icon: Bell, badge: 'alertas' },
    { to: '/app/ubicaciones', label: 'Ubicaciones', icon: MapPin },
  ] },
  { titulo: 'Administración', items: [
    { to: '/app/personas', label: 'Personas', icon: UserCheck },
    { to: '/app/reportes', label: 'Reportes', icon: BarChart2 },
    { to: '/app/usuarios', label: 'Usuarios', icon: Users, adminOnly: true },
  ] },
]

const navSolicitor = [
  { items: [
    { to: '/app/disponible', label: 'Disponible', icon: Package, end: true },
    { to: '/app/mis-tickets', label: 'Mis tickets', icon: Ticket },
  ] },
]

const ROLES = { ADMIN: 'Administrador', TOOLCRIP: 'Toolcrip', SUPERVISOR: 'Supervisor', JEFE_GRUPO: 'Jefe de grupo', OPERADOR: 'Operador' }

const iniciales = (nombre = '') => nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '—'

function Logo({ className = 'text-3xl' }) {
  return <span className={`display leading-none ${className}`} style={{ color: 'var(--accent)' }}>TOOL<span style={{ color: 'var(--text)' }}>CRIP</span></span>
}

// Aparte del Layout para que el reloj no vuelva a dibujar toda la navegación cada segundo
function Reloj() {
  const [ahora, setAhora] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex items-baseline justify-between gap-2 mb-3">
      <span className="mono text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
        {ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{ahora.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    </div>
  )
}

function Navegacion({ grupos, getBadge, onNavegar, onCerrar, user, isEncargado, onSalir }) {
  return (
    <>
      <div className="px-5 py-5 flex items-center justify-between">
        <div>
          <Logo />
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Gestor de almacén</div>
        </div>
        {onCerrar && (
          <button onClick={onCerrar} aria-label="Cerrar menú" className="p-2" style={{ color: 'var(--text-2)' }}><X size={18} /></button>
        )}
      </div>

      <nav className="flex-1 px-3 pb-3 overflow-y-auto">
        {grupos.map((g, i) => (
          <div key={g.titulo || i} className="mb-4">
            {g.titulo && <div className="px-3 mb-1 text-xs font-medium" style={{ color: 'var(--muted)' }}>{g.titulo}</div>}
            <div className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon, end, badge }) => (
                <NavLink key={to} to={to} end={end} onClick={onNavegar} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {badge && getBadge(badge) > 0 && (
                    <span className="mono text-xs font-semibold px-1.5 rounded" style={badge === 'tickets' ? { background: 'var(--accent)', color: '#14110a' } : { background: 'var(--red)', color: '#14110a' }}>
                      {getBadge(badge)}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        {isEncargado && <Reloj />}
        <div className="flex items-center gap-3">
          <span className="mono flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-xs font-semibold" style={{ background: 'var(--surface2)', color: 'var(--accent)' }}>{iniciales(user?.nombre)}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{user?.nombre}</div>
            <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{ROLES[user?.role] || user?.role}</div>
          </div>
          <button onClick={onSalir} aria-label="Cerrar sesión" title="Cerrar sesión" className="p-2 rounded-lg transition-colors hover:bg-[var(--hover)]" style={{ color: 'var(--text-2)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [alertCount, setAlertCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isEncargado = ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const { pendientes: ticketCount } = useNotificaciones()

  useEffect(() => {
    if (isEncargado) {
      api.get('/herramientas').then(r => {
        setAlertCount(r.data.herramientas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA').length)
      }).catch(() => {})
    }
  }, [isEncargado])

  const grupos = (isEncargado ? navEncargado : navSolicitor)
    .map(g => ({ ...g, items: g.items.filter(n => !n.adminOnly || user?.role === 'ADMIN') }))
    .filter(g => g.items.length)

  const getBadge = (badge) => badge === 'alertas' ? alertCount : badge === 'tickets' ? ticketCount : 0

  const propsNav = {
    grupos, getBadge, user, isEncargado,
    onSalir: () => { logout(); navigate('/login') },
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r" style={{ background: 'var(--sidebar)', borderColor: 'var(--border)' }}>
        <Navegacion {...propsNav} />
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Drawer móvil */}
      <aside className="fixed top-0 left-0 h-full z-50 flex flex-col border-r lg:hidden"
        style={{ background: 'var(--sidebar)', borderColor: 'var(--border)', width: '260px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          visibility: sidebarOpen ? 'visible' : 'hidden',
          transition: 'transform 0.25s ease, visibility 0.25s' }}>
        <Navegacion {...propsNav} onNavegar={() => setSidebarOpen(false)} onCerrar={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header móvil */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ background: 'var(--sidebar)', borderColor: 'var(--border)' }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menú" className="p-1" style={{ color: 'var(--accent)' }}>
            <Menu size={24} />
          </button>
          <Logo className="text-xl" />
          <div className="w-8 flex justify-end">
            {(alertCount > 0 || ticketCount > 0) && (
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--red)' }} title="Tienes avisos pendientes" />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
