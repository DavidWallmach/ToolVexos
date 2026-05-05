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

function Private({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminOnly({ children }) {
  const user = useAuthStore(s => s.user)
  return user?.role === 'ADMIN' ? children : <Navigate to="/app" replace />
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<Private><Layout /></Private>}>
          <Route index element={<DashboardPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="entradas" element={<EntradasPage />} />
          <Route path="salidas" element={<SalidasPage />} />
          <Route path="prestamos" element={<PrestamosPage />} />
          <Route path="mantenimiento" element={<MantenimientoPage />} />
          <Route path="movimientos" element={<MovimientosPage />} />
          <Route path="personas" element={<PersonasPage />} />
          <Route path="alertas" element={<AlertasPage />} />
          <Route path="ubicaciones" element={<UbicacionesPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="usuarios" element={<AdminOnly><UsuariosPage /></AdminOnly>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
