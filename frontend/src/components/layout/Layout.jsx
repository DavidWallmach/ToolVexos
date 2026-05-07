import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, PackagePlus, PackageMinus, ArrowLeftRight, Wrench, Users, Activity, LogOut, Bell, MapPin, UserCheck, BarChart2, Ticket } from 'lucide-react'
import useAuthStore from '../../hooks/useAuth'
import { useState, useEffect } from 'react'
import api from '../../lib/api'

// Nav completo para ADMIN y TOOLCRIP
const navEncargado = [
  { to: '/app', label: 'DASHBOARD', icon: LayoutDashboard, end: true },
  { to: '/app/inventario', label: 'MATERIALES', icon: Package },
  { to: '/app/entradas', label: 'ENTRADAS', icon: PackagePlus },
  { to: '/app/salidas', label: 'SALIDAS', icon: PackageMinus },
  { to: '/app/movimientos', label: 'MOVIMIENTOS', icon: Activity },
  { to: '/app/tickets', label: 'TICKETS', icon: Ticket, badge: 'tickets' },
  { to: '/app/personas', label: 'PERSONAS', icon: UserCheck },
  { to: '/app/alertas', label: 'ALERTAS', icon: Bell, badge: 'alertas' },
  { to: '/app/ubicaciones', label: 'UBICACIONES', icon: MapPin },
  { to: '/app/reportes', label: 'REPORTES', icon: BarChart2 },
  { to: '/app/usuarios', label: 'USUARIOS', icon: Users, adminOnly: true },
]

// Nav restringido para SUPERVISOR y JEFE_GRUPO
const navSolicitor = [
  { to: '/app/disponible', label: 'DISPONIBLE', icon: Package, end: true },
  { to: '/app/mis-tickets', label: 'MIS TICKETS', icon: Ticket },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [alertCount, setAlertCount] = useState(0)
  const [ticketCount, setTicketCount] = useState(0)

  const isEncargado = ['ADMIN', 'TOOLCRIP'].includes(user?.role)
  const isSolicitor = ['SUPERVISOR', 'JEFE_GRUPO'].includes(user?.role)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (isEncargado) {
      api.get('/herramientas').then(r => {
        setAlertCount(r.data.herramientas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA').length)
      }).catch(() => {})
      api.get('/tickets?status=PENDIENTE').then(r => {
        setTicketCount(r.data.tickets.length)
      }).catch(() => {})
    }
  }, [isEncargado])

  const nav = isEncargado
    ? navEncargado.filter(n => !n.adminOnly || user?.role === 'ADMIN')
    : navSolicitor

  const timeStr = time.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const dateStr = time.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase()

  const getBadgeCount = (badge) => {
    if (badge === 'alertas') return alertCount
    if (badge === 'tickets') return ticketCount
    return 0
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#0a0a0a'}}>
      <aside className="w-52 flex-shrink-0 flex flex-col border-r" style={{background:'#0d0d0d', borderColor:'#1a1a1a'}}>
        <div className="px-4 py-5 border-b" style={{borderColor:'#1a1a1a'}}>
          <div className="display text-3xl leading-none" style={{color:'#f5a623'}}>TOOL<span style={{color:'#e8e8e8'}}>CRIP</span></div>
          <div className="mono mt-1" style={{color:'#333', fontSize:'9px', letterSpacing:'0.15em'}}>GESTOR DE ALMACÉN v2.2</div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={13} />
              <span style={{fontSize:'11px', letterSpacing:'0.06em', flex:1}}>{label}</span>
              {badge && getBadgeCount(badge) > 0 && (
                <span className="mono font-bold px-1.5 py-0.5" style={{background: badge==='tickets'?'#f5a623':'#e74c3c', color: badge==='tickets'?'#000':'#fff', fontSize:'9px', borderRadius:'2px'}}>
                  {getBadgeCount(badge)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t" style={{borderColor:'#1a1a1a'}}>
          <div className="mb-3 pb-3 border-b" style={{borderColor:'#1a1a1a'}}>
            <div className="mono font-bold" style={{color:'#f5a623', fontSize:'16px'}}>{timeStr}</div>
            <div className="mono" style={{color:'#333', fontSize:'9px'}}>{dateStr}</div>
          </div>
          <div className="mb-3">
            <div className="mono text-xs truncate" style={{color:'#888'}}>{user?.nombre}</div>
            <div className="mono" style={{color:'#444', fontSize:'10px'}}>
              {user?.empleado} · <span style={{color: user?.role==='ADMIN'?'#f5a623': user?.role==='TOOLCRIP'?'#2ecc71':'#3b82f6'}}>{user?.role}</span>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} className="btn-ghost w-full justify-center mono py-2" style={{fontSize:'11px'}}>
            <LogOut size={12} /> SALIR
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
