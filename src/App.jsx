import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminLayout from './components/AdminLayout'
import ProfesorLayout from './components/ProfesorLayout'
import Dashboard from './pages/admin/Dashboard'
import NuevoCurso from './pages/admin/cursos/nuevo'
import Cursos from './pages/admin/Cursos'
import CursoDetalle from './pages/admin/CursoDetalle'
import Inscripciones from './pages/admin/Inscripciones'
import Cobros from './pages/admin/Cobros'
import Asistencia from './pages/admin/Asistencia'
import Alumnas from './pages/admin/Alumnas'
import Deudas from './pages/admin/Deudas'
import Ingresos from './pages/admin/Ingresos'
import Usuarios from './pages/admin/Usuarios'
import ProfesorDashboard from './pages/profesor/Dashboard'
import ProfesorAsistencia from './pages/profesor/Asistencia'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="cursos/nuevo" element={<NuevoCurso />} />
              <Route path="cursos/:id" element={<CursoDetalle />} />
              <Route path="cursos" element={<Cursos />} />
              <Route path="inscripciones" element={<Inscripciones />} />
              <Route path="cobros" element={<Cobros />} />
              <Route path="asistencia" element={<Asistencia />} />
              <Route path="alumnas" element={<Alumnas />} />
              <Route path="deudas" element={<Deudas />} />
              <Route path="ingresos" element={<Ingresos />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
            
            <Route path="/profesor" element={<ProfesorRoute />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ProfesorDashboard />} />
              <Route path="asistencia/:cursoId" element={<ProfesorAsistencia />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
        <p className="mt-2 text-sm text-gray-600">Cargando...</p>
      </div>
    </div>
  )
}

// Redirección inicial según rol
function HomeRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  
  if (!user) return <Navigate to="/login" replace />
  
  if (!profile) return <LoadingScreen />

  if (profile.rol === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (profile.rol === 'profesor') {
    return <Navigate to="/profesor/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}

// Protected route wrapper
function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

// Admin-only route
function AdminRoute() {
  const { profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  
  if (!profile) return <LoadingScreen />

  if (profile.rol !== 'admin') {
    return <Navigate to="/profesor/dashboard" replace />
  }

  return <AdminLayout />
}

// Profesor-only route
function ProfesorRoute() {
  const { profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  
  if (!profile) return <LoadingScreen />

  if (profile.rol !== 'profesor') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <ProfesorLayout />
}

export default App