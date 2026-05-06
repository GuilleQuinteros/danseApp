import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper: obtener el usuario actual
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper: obtener perfil completo del usuario
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      profesores(*)
    `)
    .eq('id', userId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

// Helper: verificar si es admin
export const isAdmin = async () => {
  const user = await getCurrentUser()
  if (!user) return false
  
  const { data } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  
  return data?.rol === 'admin'
}

// Helper: verificar si es profesor
export const isProfesor = async () => {
  const user = await getCurrentUser()
  if (!user) return false
  
  const { data } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()
  
  return data?.rol === 'profesor'
}
