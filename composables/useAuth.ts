import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  // Use our custom Supabase composable
  const supabase = useSupabase()
  const user = useState<User | null>('user', () => null)
  const loading = useState('auth-loading', () => true)

  // Initialize - load current user
  const initialize = async () => {
    loading.value = true
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser
      
      // Listen for authentication changes
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    // Check if user is already logged in (more secure - authenticates with Supabase Auth server)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // User is already logged in, don't perform OAuth flow
      return
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          // Removed prompt: 'consent' - allows automatic sign-in if user is already signed in to Google
        }
      }
    })
    
    if (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
    user.value = null
    await navigateTo('/login')
  }

  // Check role
  const getUserRole = async () => {
    if (!user.value) return null
    
    // Get role from database
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
