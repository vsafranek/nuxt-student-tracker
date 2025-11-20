export default defineNuxtRouteMiddleware(async (to, from) => {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // Pokud je uživatel přihlášen, přesměruj
    if (session?.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      const role = userData?.role || 'teacher'
      
      if (role === 'teacher') {
        return navigateTo('/teacher/dashboard')
      } else {
        return navigateTo('/student/groups')
      }
    }
  })
  