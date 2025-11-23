import { vi } from 'vitest'
import { ref, readonly } from 'vue'

// Make Vue composables available globally
global.ref = ref
global.readonly = readonly
global.computed = vi.fn((fn) => {
  const value = ref(fn())
  return {
    get value() { return value.value },
    set value(v) { value.value = v }
  }
})
global.watch = vi.fn()
global.watchEffect = vi.fn()
// Vue Test Utils handles lifecycle hooks automatically when mounting components
// We keep these as mocks for global availability, but Vue Test Utils uses the real ones
global.onMounted = vi.fn()
global.onUnmounted = vi.fn()
global.onBeforeUnmount = vi.fn()
global.nextTick = vi.fn(() => Promise.resolve())
global.useState = vi.fn((key, init) => {
  const value = typeof init === 'function' ? init() : init
  return ref(value)
})

// Mock environment variables
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key'
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'

// Mock navigateTo globally
global.navigateTo = vi.fn()

// Mock Nuxt auto-imports
vi.mock('#app', () => {
  const { ref, readonly } = require('vue')
  return {
    useSupabaseClient: vi.fn(),
    useSupabaseUser: vi.fn(() => ref({ id: 'test-user-id', email: 'test@example.com' })),
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn()
    })),
    useRoute: vi.fn(() => ({
      params: {},
      query: {}
    })),
    navigateTo: global.navigateTo,
    useState: vi.fn((key, init) => {
      const value = typeof init === 'function' ? init() : init
      return ref(value)
    }),
    readonly: readonly,
    definePageMeta: vi.fn(),
    useRuntimeConfig: vi.fn(() => ({
      public: {
        supabaseUrl: 'http://localhost:54321',
        supabaseAnonKey: 'test-anon-key'
      }
    }))
  }
})

// Mock Supabase client
vi.mock('#supabase/server', () => ({
  serverSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id', email: 'test@example.com' } }, error: null }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    removeChannel: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => Promise.resolve())
      }))
    }))
  }))
}))

// Mock useSupabase composable
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: null } }))
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }))
}

vi.mock('~/composables/useSupabase', () => ({
  useSupabase: vi.fn(() => mockSupabaseClient)
}))

// Make useSupabase available globally
global.useSupabase = vi.fn(() => mockSupabaseClient)

// Global test utilities
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

