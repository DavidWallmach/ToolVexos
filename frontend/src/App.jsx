import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import useAuthStore from './hooks/useAuth'

import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InventarioPage from './pages/InventarioPage'
import EntradasPage from './pages/EntradasPage'
import SalidasPage from './pages/SalidasPage'
import PrestamosPage from './pages/PrestamosPage'
import MantenimientoPage from './pages/MantenimientoPage'
import MovimientosPage from './pages/MovimientosPage'
import UsuariosPage from './pages/UsuariosPage'
import AlertasPage from './pages/AlertasPage'
import UbicacionesPage from './pages/UbicacionesPage'
import PersonasPage from './pages/PersonasPage'
import ReportesPage from './pages/ReportesPage'
import TicketsPage from './pages/TicketsPage'
import MisTicketsPage from './pages/MisTicketsPage'
import DisponiblePage from './pages/DisponiblePage'

function Private({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminOnly({ children }) {
  const user = useAuthStore(s => s.user)
  return user?.role === 'ADMIN' ? children : <Navigate to="/app" replace />
}

function EncargadoOnly({ children }) {
  const user = useAuthStore(s => s.user)
  return ['ADMIN','TOOLCRIP'].includes(user?.role) ? children : <Navigate to="/app/disponible" replace />
}

function RootRedirect() {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (['SUPERVISOR','JEFE_GRUPO','OPERADOR'].includes(user.role)) return <Navigate to="/app/disponible" replace />
  return <Navigate to="/app" replace />
}

export default function App() {
  const { token, fetchMe } = useAuthStore()
  useEffect(() => { if (token) fetchMe() }, [])

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{
        style: { background:'#1a1a1a', color:'#e8e8e8', border:'1px solid #2a2a2a', fontFamily:'IBM Plex Mono', fontSize:'12px' },
        success: { iconTheme: { primary:'#f5a623', secondary:'#0a0a0a' } }
      }} />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<Private><Layout /></Private>}>
          {/* Encargado routes */}
          <Route index element={<EncargadoOnly><DashboardPage /></EncargadoOnly>} />
          <Route path="inventario" element={<EncargadoOnly><InventarioPage /></EncargadoOnly>} />
          <Route path="entradas" element={<EncargadoOnly><EntradasPage /></EncargadoOnly>} />
          <Route path="salidas" element={<EncargadoOnly><SalidasPage /></EncargadoOnly>} />
          <Route path="prestamos" element={<EncargadoOnly><PrestamosPage /></EncargadoOnly>} />
          <Route path="mantenimiento" element={<EncargadoOnly><MantenimientoPage /></EncargadoOnly>} />
          <Route path="movimientos" element={<EncargadoOnly><MovimientosPage /></EncargadoOnly>} />
          <Route path="tickets" element={<EncargadoOnly><TicketsPage /></EncargadoOnly>} />
          <Route path="personas" element={<EncargadoOnly><PersonasPage /></EncargadoOnly>} />
          <Route path="alertas" element={<EncargadoOnly><AlertasPage /></EncargadoOnly>} />
          <Route path="ubicaciones" element={<EncargadoOnly><UbicacionesPage /></EncargadoOnly>} />
          <Route path="reportes" element={<EncargadoOnly><ReportesPage /></EncargadoOnly>} />
          <Route path="usuarios" element={<AdminOnly><UsuariosPage /></AdminOnly>} />
          {/* Supervisor / Jefe routes */}
          <Route path="disponible" element={<DisponiblePage />} />
          <Route path="mis-tickets" element={<MisTicketsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
