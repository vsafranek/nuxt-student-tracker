import { createClient } from '@supabase/supabase-js'

/**
 * @deprecated Use getSupabaseClient() from '~/server/utils/database' instead
 * This function is kept for backward compatibility
 */
export const createSupabaseServerClient = () => {
  const config = useRuntimeConfig()
  
  return createClient(
    config.supabaseUrl,
    config.supabaseKey, // Service role key for server-side operations
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

