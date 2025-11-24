<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 via-purple-50 to-pink-50">
    <div class="text-center space-y-6 max-w-md px-4">
      <!-- Animated logo -->
      <div class="flex justify-center">
        <div class="relative">
          <div class="w-24 h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <div class="loading-spinner w-12 h-12 border-4 border-white border-t-transparent"></div>
          </div>
          <div class="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-50 -z-10 animate-pulse"></div>
        </div>
      </div>
      
      <!-- Text content -->
      <div class="space-y-2">
        <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Přihlašování...
        </h2>
        <p class="text-gray-600 text-lg">
          Dokončujeme vaše přihlášení
        </p>
      </div>
      
      <!-- Progress dots -->
      <div class="flex justify-center gap-2 pt-4">
        <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0s"></div>
        <div class="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const { showToast } = useToast()

onMounted(async () => {
  try {
    // Wait a bit for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // More secure - authenticates with Supabase Auth server
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    
    if (user) {
      // Check or create user record
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }
      
      if (!existingUser) {
        // Create new record
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Uživatel',
          role: 'teacher', // Default role
        })
        
        if (insertError) {
          console.error('Error creating user:', insertError)
        }
      }
      
      // Show success message
      showToast({
        message: 'Úspěšně přihlášeno!',
        type: 'success'
      })
      
      // Redirect based on role
      const role = existingUser?.role || 'teacher'
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for toast
      
      if (role === 'teacher') {
        await router.push('/teacher/dashboard')
      } else {
        // Students are redirected to the home page where they can join a group
        await router.push('/')
      }
    } else {
      throw new Error('Nepodařilo se získat uživatele')
    }
  } catch (error: any) {
    console.error('Callback error:', error)
    showToast({
      message: 'Chyba při přihlášení. Zkuste to prosím znovu.',
      type: 'error'
    })
    await router.push('/?error=auth_failed')
  }
})
</script>

<style scoped>
.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
  