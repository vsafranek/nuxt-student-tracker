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

// Sledování auth stavu
onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session)
  })
})
</script>
