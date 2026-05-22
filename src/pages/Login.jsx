import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DanseLogo from '../components/DanseLogo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, user, profile } = useAuth()
  const navigate = useNavigate()

  // Redirect si ya está logueado
  useEffect(() => {
    if (user && profile) {
      if (profile.rol === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (profile.rol === 'profesor') {
        navigate('/profesor/dashboard', { replace: true })
      }
    }
  }, [user, profile, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user: authUser } = await signIn(email, password)
      
      // El AuthContext ya cargó el perfil
      // La redirección la maneja el useEffect de arriba
      console.log('Login exitoso:', authUser.email)
      
    } catch (err) {
      console.error('Login error:', err)
      setError('Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sage-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <DanseLogo className="w-16 h-20" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">
            dans<span className="text-teal-600">é</span>
          </h1>
          <p className="text-sm text-gray-600 tracking-[2px] uppercase">Estudio de Danza</p>
          <p className="text-xs text-gray-500 mt-1">Dir. Karina Molina</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Iniciar sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="tu@email.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 focus:ring-4 focus:ring-teal-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Sistema de gestión para estudios de danza
            </p>
          </div>
        </div>

        {/* Info de demo */}
        {/* <div className="mt-6 p-4 bg-teal-50 border border-teal-100 rounded-lg">
          <p className="text-xs text-teal-800 font-medium mb-2">Credenciales de prueba:</p>
          <div className="space-y-1 text-xs text-teal-700">
            <p><span className="font-semibold">Admin:</span> admin@danse.com / admin123</p>
            <p><span className="font-semibold">Profesor:</span> laura@danse.com / profesor123</p>
          </div>
        </div>*/}
      </div>
    </div>
  )
}