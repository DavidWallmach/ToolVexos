import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, PackagePlus, PackageMinus, ArrowLeftRight, Wrench, Users, Activity, LogOut, Bell, MapPin, UserCheck } from 'lucide-react'
import useAuthStore from '../../hooks/useAuth'
import { useState, useEffect } from 'react'
import api from '../../lib/api'

const nav = [
  { to: '/app', label: 'DASHBOARD', icon: LayoutDashboard, end: true },
  { to: '/app/inventario', label: 'MATERIALES', icon: Package },
  { to: '/app/entradas', label: 'ENTRADAS', icon: PackagePlus },
  { to: '/app/salidas', label: 'SALIDAS', icon: PackageMinus },
  { to: '/app/movimientos', label: 'MOVIMIENTOS', icon: Activity },
  { to: '/app/personas', label: 'PERSONAS', icon: UserCheck },
  { to: '/app/alertas', label: 'ALERTAS', icon: Bell, badge: true },
  { to: '/app/ubicaciones', label: 'UBICACIONES', icon: MapPin },
  { to: '/app/usuarios', label: 'USUARIOS', icon: Users, adminOnly: true },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [alertCount, setAlertCount] = useState(0)

  // Reloj en tiempo real
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Contar alertas
  useEffect(() => {
    api.get('/herramientas').then(r => {
      const count = r.data.herramientas.filter(h => h.stockDisp <= h.stockMin && h.status !== 'BAJA').length
      setAlertCount(count)
    }).catch(() => {})
  }, [])

  const visibleNav = nav.filter(n => !n.adminOnly || user?.role === 'ADMIN')

  const timeStr = time.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const dateStr = time.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#0a0a0a'}}>
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 flex flex-col border-r" style={{background:'#0d0d0d', borderColor:'#1a1a1a'}}>
        {/* Logo */}
        <div className="px-4 py-5 border-b" style={{borderColor:'#1a1a1a'}}>
          <div className="display text-3xl leading-none" style={{color:'#f5a623'}}>TOOL<span style={{color:'#e8e8e8'}}>CRIP</span></div>
          <div className="mono mt-1" style={{color:'#333', fontSize:'9px', letterSpacing:'0.15em'}}>GESTOR DE ALMACÉN v2.1</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {visibleNav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={13} />
              <span style={{fontSize:'11px', letterSpacing:'0.06em', flex:1}}>{label}</span>
              {badge && alertCount > 0 && (
                <span className="mono text-xs font-bold px-1.5 py-0.5" style={{background:'#e74c3c', color:'#fff', fontSize:'9px', borderRadius:'2px'}}>
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + clock */}
        <div className="p-4 border-t" style={{borderColor:'#1a1a1a'}}>
          {/* Reloj */}
          <div className="mb-3 pb-3 border-b" style={{borderColor:'#1a1a1a'}}>
            <div className="mono font-bold" style={{color:'#f5a623', fontSize:'16px', letterSpacing:'0.05em'}}>{timeStr}</div>
            <div className="mono" style={{color:'#333', fontSize:'9px'}}>{dateStr}</div>
          </div>
          <div className="mb-3">
            <div className="mono text-xs truncate" style={{color:'#888'}}>{user?.nombre}</div>
            <div className="mono" style={{color:'#444', fontSize:'10px'}}>{user?.empleado} · <span style={{color: user?.role==='ADMIN'?'#f5a623':'#555'}}>{user?.role}</span></div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} className="btn-ghost w-full justify-center mono py-2" style={{fontSize:'11px', letterSpacing:'0.08em'}}>
            <LogOut size={12} /> SALIR
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
