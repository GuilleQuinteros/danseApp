import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DanseLogo from './DanseLogo'

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon, section: 'Principal' },
    { to: '/admin/cursos', label: 'Cursos activos', icon: UsersIcon, section: 'Principal' },
    { to: '/admin/inscripciones', label: 'Inscripciones', icon: ClipboardIcon, section: 'Principal' },
    { to: '/admin/cobros', label: 'Cobros', icon: CreditCardIcon, section: 'Principal'},
    { to: '/admin/alumnas', label: 'Alumnas', icon: UsersIcon, section: 'Principal' },
    { to: '/admin/asistencia', label: 'Asistencia', icon: CheckIcon, section: 'Reportes' },
    { to: '/admin/deudas', label: 'Deudas', icon: DollarIcon, section: 'Reportes',},
    { to: '/admin/ingresos', label: 'Ingresos', icon: ChartIcon, section: 'Reportes' },
    { to: '/admin/usuarios', label: 'Usuarios', icon: UsersGearIcon, section: 'Admin' }
  ]

  let lastSection = null

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-[238px] min-w-[238px] bg-gradient-to-b from-teal-800 via-teal-900 to-[#072e2a] flex flex-col overflow-y-auto border-r border-teal-300/10">
        
        {/* Logo */}
        <div className="px-[18px] py-[22px] border-b border-teal-300/15 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <DanseLogo className="w-[38px] h-[44px] flex-shrink-0" />
            <div className="flex flex-col">
              <div className="font-serif text-[22px] font-bold text-white leading-none tracking-tight">
                dans<span className="text-teal-300">é</span>
              </div>
              <div className="text-[9px] tracking-[2px] text-teal-300 font-medium uppercase mt-0.5">
                Estudio de Danza
              </div>
              <div className="text-[9px] text-white/40 mt-0.5">Dir. Karina Molina</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const showSection = lastSection !== item.section
            lastSection = item.section
            return (
              <div key={item.to}>
                {showSection && (
                  <div className="px-[18px] pt-[18px] pb-1.5 text-[9px] tracking-[1.5px] font-semibold text-teal-300/50 uppercase">
                    {item.section}
                  </div>
                )}
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2 mx-2 my-0.5 rounded-lg text-[13px] transition-all border ${
                      isActive
                        ? 'bg-gradient-to-br from-teal-300/25 to-teal-400/15 text-white font-medium border-teal-300/30'
                        : 'text-white/65 hover:bg-teal-300/10 hover:text-white border-transparent hover:border-teal-300/15'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0 opacity-85" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 ${
                      item.badgeRed ? 'bg-red-400 text-white' : 'bg-teal-300 text-teal-900'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-3.5 border-t border-teal-300/12">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/7 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-xs border-[1.5px] border-teal-300/40">
              {profile?.nombre_completo?.charAt(0) || 'K'}M
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">
                {profile?.nombre_completo || 'Usuario'}
              </div>
              <div className="text-[10px] text-teal-300/80 truncate">
                {profile?.rol === 'admin' ? 'Directora · Admin' : 'Usuario'}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full mt-2 px-3 py-1.5 text-xs text-teal-300 hover:text-white hover:bg-white/7 rounded-md transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-[58px] bg-white border-b border-gray-200 px-7 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">💃</span>
            <h1 className="text-base font-semibold text-gray-900">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full border border-teal-100">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto bg-[#f4f9f8] p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function getPageTitle(pathname) {
  const titles = {
    '/admin/dashboard': 'Dashboard',
    '/admin/cursos': 'Cursos activos',
    '/admin/inscripciones': 'Inscripciones',
    '/admin/cobros': 'Cobros',
    '/admin/asistencia': 'Reporte de asistencia',
    '/admin/deudas': 'Alertas de deuda',
    '/admin/ingresos': 'Reporte de ingresos',
    '/admin/usuarios': 'Gestión de usuarios'
  }
  return titles[pathname] || 'Dashboard'
}

// Icons
function DashboardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="2" width="7" height="7" rx="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5"/>
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="7" r="3"/>
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    </svg>
  )
}

function ClipboardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V8l-4-6z"/>
      <line x1="8" y1="11" x2="12" y2="11"/>
      <line x1="10" y1="9" x2="10" y2="13"/>
    </svg>
  )
}

function CreditCardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="5" width="16" height="12" rx="2"/>
      <path d="M2 9h16"/>
      <circle cx="6" cy="14" r="1"/>
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 11l2 2 4-4"/>
      <rect x="3" y="3" width="14" height="14" rx="2"/>
    </svg>
  )
}

function DollarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2v16M6 6h6a2 2 0 010 4H8a2 2 0 000 4h7"/>
    </svg>
  )
}

function ChartIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <polyline points="2 13 6 8 9 11 12 7 18 13"/>
    </svg>
  )
}

function UsersGearIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="7" r="3"/>
      <path d="M1 17c0-3 2.7-5 6-5"/>
      <circle cx="14" cy="9" r="2.5"/>
      <path d="M10 17c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
    </svg>
  )
}
