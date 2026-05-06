import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getUserProfile } from '../lib/supabase'
import { useRef } from 'react'
const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const loadingProfileRef = useRef(false)

  useEffect(() => {
  let mounted = true

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!mounted) return

    if (session?.user) {
      setUser(session.user)
  
      await loadUserProfile(session.user.id)
    } else {
    setLoading(false)
    } 
  }

  init()

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth event:', event)

      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
  // 🔥 evitar recarga innecesaria
  if (user?.id === session.user.id && profile) {
    console.log('⛔ Usuario ya cargado, se ignora')
    return
  }
  setUser(session.user)
  await loadUserProfile(session.user.id)
}
    }
  )

  return () => {
    mounted = false
    subscription.unsubscribe()
  }
}, [])

  const loadUserProfile = async (userId) => {
  if (loadingProfileRef.current) {
    console.log('⛔ loadProfile ya en ejecución, se ignora')
    setLoading(false)
    return
  }

  loadingProfileRef.current = true

  try {
    console.log('Loading profile for user:', userId)

    const data = await Promise.race([
      getUserProfile(userId),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile timeout')), 2500)
      )
    ])

    console.log('Profile loaded:', data)
    setProfile(data)

  } catch (error) {
    console.error('Error loading profile:', error)

    // 🔥 NO romper estado si es timeout
    if (error.message === 'Profile timeout') {
      console.log('⏳ Timeout ignorado, mantengo perfil actual')
      return
    }

    setProfile(null)

  } finally {
    setIsLoadingProfile(false)
    setLoading(false)
    loadingProfileRef.current = false
  }
}

  const signIn = async (email, password) => {
  setLoading(true)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error

    // ✅ NO cargar perfil acá
    return data

  } catch (error) {
    setLoading(false)
    throw error
  }
}

  const signOut = async () => {
  try {
    setLoading(true)

    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // NO tocar estados acá
    // los maneja onAuthStateChange

  } catch (error) {
    console.error('Error signing out:', error)
    setLoading(false)
    throw error
  }
}

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: profile?.rol === 'admin',
    isProfesor: profile?.rol === 'profesor'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}