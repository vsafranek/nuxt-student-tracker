<template>
  <div id="app" class="min-h-screen">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Inicializace autentizace při startu aplikace
const supabase = useSupabaseClient()

// Head konfigurace
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - StudentTracker` : 'StudentTracker - Sledování pokroku studentů'
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

// Sledování auth stavu a automatické obnovování session
onMounted(() => {
  // Zkontrolovat a obnovit session při startu
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('Session found on app mount:', session.user.email)
    }
  })
  
  // Poslouchat změny auth stavu
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.email)
    
    // Automaticky obnovit token pokud je potřeba
    if (session && event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully')
    }
  })
  
  // Supabase automaticky obnovuje tokeny, takže interval není nutný
  // Pokud by bylo potřeba explicitní obnovování, můžeme použít:
  // setInterval(async () => {
  //   const { data: { session } } = await supabase.auth.getSession()
  //   if (session) {
  //     await supabase.auth.refreshSession()
  //   }
  // }, 55 * 60 * 1000) // 55 minut
})
</script>
