import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'
import * as schema from '../database/schema'

// Create singleton instances
let pool: Pool | null = null
let drizzleDb: ReturnType<typeof drizzle> | null = null
let supabaseClient: ReturnType<typeof createClient> | null = null

/**
 * Get or create a Drizzle database instance connected to Supabase
 * Uses connection pooling for better performance
 */
export const getDrizzleDb = () => {
  const config = useRuntimeConfig()
  
  if (!drizzleDb) {
    if (!pool) {
      pool = new Pool({
        connectionString: config.databaseUrl || process.env.DATABASE_URL,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: {
          rejectUnauthorized: false // Required for Supabase self-signed certificates
        }
      })
    }
    
    drizzleDb = drizzle(pool, { schema })
  }
  
  return drizzleDb
}

/**
 * Get or create a Supabase client for server-side operations
 * Uses service role key (bypasses RLS)
 */
export const getSupabaseClient = () => {
  const config = useRuntimeConfig()
  
  if (!supabaseClient) {
    supabaseClient = createClient(
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
  
  return supabaseClient
}

/**
 * Get both Drizzle and Supabase instances together
 * Useful when you need both type-safe queries and Supabase features (auth, storage, etc.)
 */
export const getDatabase = () => {
  return {
    db: getDrizzleDb(),
    supabase: getSupabaseClient(),
    schema
  }
}

