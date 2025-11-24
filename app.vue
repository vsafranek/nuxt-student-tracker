<template>
  <div id="app" class="min-h-screen">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Initialize authentication on app startup
const supabase = useSupabaseClient()

// Head configuration
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - EduGuide` : 'EduGuide - Sledování pokroku studentů'
  },
  htmlAttrs: {
    lang: 'cs'
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Realtime sledování pokroku studentů pomocí AI asistenta' },
    { name: 'theme-color', content: '#2563eb' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})

// Track auth state and automatically refresh session
onMounted(() => {
  // Check and refresh user on startup (more secure - authenticates with Supabase Auth server)
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      console.log('User found on app mount:', user.email)
    }
  })
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.email)
    
    // Automatically refresh token if needed
    if (session && event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully')
    }
  })
})
</script>
