import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  // Use our custom Supabase composable
  const supabase = useSupabase()
  const user = useState<User | null>('user', () => null)
  const loading = useState('auth-loading', () => true)

  // Inicializace - načtení aktuálního uživatele
  const initialize = async () => {
    loading.value = true
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser
      
      // Poslouchání změn autentizace
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }

  // Přihlášení přes Google
  const signInWithGoogle = async () => {
    // Zkontrolovat, zda už není uživatel přihlášen
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Uživatel je už přihlášen, neprovádět OAuth flow
      return
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          // Odstraněno prompt: 'consent' - umožní automatické přihlášení pokud už je uživatel přihlášen v Google
        }
      }
    })
    
    if (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  // Odhlášení
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    user.value = null
    await navigateTo('/login')
  }

  // Kontrola role
  const getUserRole = async () => {
    if (!user.value) return null
    
    // Získání role z databáze
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.value.id)
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }
    
    return data?.role
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialize,
    signInWithGoogle,
    signOut,
    getUserRole
  }
}
