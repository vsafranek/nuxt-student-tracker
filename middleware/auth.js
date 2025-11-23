export default defineNuxtRouteMiddleware(async (to, from) => {
    const supabase = useSupabaseClient()
    // More secure - authenticates with Supabase Auth server
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return navigateTo('/')
    }
  })
  