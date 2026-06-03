import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, PackagePlus, PackageMinus, Activity, LogOut, Bell, MapPin, UserCheck, BarChart2, Ticket, Menu, X, Users } from 'lucide-react'
import useAuthStore from '../../hooks/useAuth'
import { useState, useEffect } from 'react'
import api from '../../lib/api'
import useNotificaciones from '../../hooks/useNotificaciones.jsx'

const navEncargado = [
  { to: '/app', label: 'DASHBOARD', icon: LayoutDashboard, end: true },
  { to: '/app/inventario', label: 'MATERIALES', icon: Package },
  { to: '/app/entradas', label: 'ENTRADAS', icon: PackagePlus },
  { to: '/app/salidas', label: 'SALIDAS', icon: PackagePlus },
  { to: '/app/movimientos', label: 'MOVIMIENTOS', icon: Activity },
  { to: '/app/tickets', label: 'TICKETS', icon: Ticket, badge: 'tickets' },
  { to: '/app/personas', label: 'PERSONAS', icon: UserCheck },
  { to: '/app/alertas', label: 'ALERTAS', icon: Bell, badge: 'alertas' },
  { to: '/app/ubicaciones', label: 'UBICACIONES', icon: MapPin },
  { to: '/app/reportes', label: 'REPORTES', icon: BarChart2 },
  { to: '/app/usuarios', label: 'USUARIOS', icon: Users, adminOnly: true },
]

const navSolicitor = [
  { to: '/app/disponible', label: 'DISPONIBLE', icon: Package, end: true },
  { to: '/app/mis-tickets', label: 'MIS TICKETS', icon: Ticket },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [alertCount, setAlertCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isEncargado = ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const { pendientes: ticketCount } = useNotificaciones()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (isEncargado) {
      api.get('/herramientas').then(r => {
        setAlertCount(r.data.herramientas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA').length)
      }).catch(() => {})
    }
  }, [isEncargado])

  const nav = isEncargado
    ? navEncargado.filter(n => !n.adminOnly || user?.role === 'ADMIN')
    : navSolicitor

  const timeStr = time.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const dateStr = time.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase()

  const getBadge = (badge) => badge === 'alertas' ? alertCount : badge === 'tickets' ? ticketCount : 0

  const NavItems = () => (
    <>
      <div className="px-4 py-5 border-b flex items-center justify-between" style={{borderColor:'#1a1a1a'}}>
        <div>
          <div className="display text-3xl leading-none" style={{color:'#f5a623'}}>TOOL<span style={{color:'#e8e8e8'}}>CRIP</span></div>
          <div className="mono mt-1" style={{color:'#333', fontSize:'9px', letterSpacing:'0.15em'}}>GESTOR DE ALMACÉN v2.2</div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2" style={{color:'#555'}}>
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={13} />
            <span style={{fontSize:'11px', letterSpacing:'0.06em', flex:1}}>{label}</span>
            {badge && getBadge(badge) > 0 && (
              <span style={{background:badge==='tickets'?'#f5a623':'#e74c3c', color:badge==='tickets'?'#000':'#fff', fontSize:'9px', borderRadius:'2px', padding:'1px 5px', fontWeight:'bold'}}>
                {getBadge(badge)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {isEncargado && (
        <div className="px-4 py-2 border-t" style={{borderColor:'#1a1a1a'}}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{background:'#2ecc71', boxShadow:'0 0 4px #2ecc71'}} />
            <span className="mono" style={{color:'#333', fontSize:'9px'}}>NOTIFICACIONES ACTIVAS</span>
          </div>
        </div>
      )}

      <div className="p-4 border-t" style={{borderColor:'#1a1a1a'}}>
        <div className="mb-3 pb-3 border-b" style={{borderColor:'#1a1a1a'}}>
          <div className="mono font-bold" style={{color:'#f5a623', fontSize:'16px'}}>{timeStr}</div>
          <div className="mono" style={{color:'#333', fontSize:'9px'}}>{dateStr}</div>
        </div>
        <div className="mb-3">
          <div className="mono text-xs truncate" style={{color:'#888'}}>{user?.nombre}</div>
          <div className="mono" style={{color:'#444', fontSize:'10px'}}>
            {user?.empleado} · <span style={{color:user?.role==='ADMIN'?'#f5a623':user?.role==='TOOLCRIP'?'#2ecc71':'#3b82f6'}}>{user?.role}</span>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="btn-ghost w-full justify-center mono py-2" style={{fontSize:'11px'}}>
          <LogOut size={12} /> SALIR
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#0a0a0a'}}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-52 flex-shrink-0 flex-col border-r" style={{background:'#0d0d0d', borderColor:'#1a1a1a'}}>
        <NavItems />
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{background:'rgba(0,0,0,0.75)'}}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Drawer móvil */}
      <aside className="fixed top-0 left-0 h-full z-50 flex flex-col border-r lg:hidden"
        style={{background:'#0d0d0d', borderColor:'#1a1a1a', width:'240px',
          transform:sidebarOpen?'translateX(0)':'translateX(-100%)',
          transition:'transform 0.25s ease'}}>
        <NavItems />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{background:'#0d0d0d', borderColor:'#1a1a1a', flexShrink:0}}>
          <button onClick={() => setSidebarOpen(true)} style={{color:'#f5a623', padding:'4px'}}>
            <Menu size={24} />
          </button>
          <div className="display text-xl" style={{color:'#f5a623'}}>TOOL<span style={{color:'#e8e8e8'}}>CRIP</span></div>
          <div className="flex items-center gap-2">
            {(alertCount > 0 || ticketCount > 0) && (
              <div className="w-2 h-2 rounded-full" style={{background:'#e74c3c'}} />
            )}
            <span className="mono text-xs" style={{color:'#555'}}>{user?.role}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
