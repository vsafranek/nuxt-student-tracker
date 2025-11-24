import tailwindcss from "@tailwindcss/vite";


export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  modules: [
    '@nuxtjs/supabase'
  ],
  
  supabase: {
    redirect: false, 
    redirectOptions: {
      login: '/',
      callback: '/auth/callback',
      exclude: ['/join', '/join/*'],
    },
    // Ensure session is persistent
    clientOptions: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    }
  },
  nitro: {
    experimental: {
      websocket: true
    }
  },
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    // Azure OpenAI configuration
    azureOpenAiApiBase: process.env.AZURE_OPENAI_API_BASE,
    azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAiApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'models-gpt-4o',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
    databaseUrl: process.env.DATABASE_URL,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    }
  },
  app: {
    head: {
      title: 'EduGuide - Sledování pokroku studentů',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Aplikace pro realtime sledování pokroku studentů' }
      ]
    }
  }
  
})