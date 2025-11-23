export default defineNuxtRouteMiddleware(async (to, from) => {
    const supabase = useSupabaseClient()
    // More secure - authenticates with Supabase Auth server
    const { data: { user } } = await supabase.auth.getUser()
    
    // Pokud je uživatel přihlášen, přesměruj
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = userData?.role || 'teacher'
      
      if (role === 'teacher') {
        return navigateTo('/teacher/dashboard')
      } else {
        return navigateTo('/student/groups')
      }
    }
  })
  