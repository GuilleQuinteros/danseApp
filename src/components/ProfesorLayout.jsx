import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DanseLogo from './DanseLogo'

export default function ProfesorLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-[#072e2a] text-white">
      {/* Header */}
      <div className="px-5 py-5 border-b border-teal-300/15 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <DanseLogo className="w-[22px] h-[26px]" />
            <div className="font-serif text-lg font-semibold">dansé</div>
          </div>
          <div className="text-xs text-teal-200 mt-1">
            {profile?.nombre_completo} · {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-xs bg-white/12 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
        >
          ← Salir
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <Outlet />
      </div>
    </div>
  )
}
