import { getDatabase } from '~/server/utils/database'

/**
 * Composable to access database utilities on the client side
 * Note: This will only work in server-side contexts (API routes, server middleware, etc.)
 * For client-side, use useSupabase() instead
 */
export const useDatabase = () => {
  // This composable is primarily for server-side usage
  // In Nuxt 3, composables can be used in both client and server
  // but database connections should only be used server-side
  if (import.meta.server) {
    return getDatabase()
  }
  
  // On client-side, return null or throw an error
  throw new Error('useDatabase() can only be used server-side. Use useSupabase() for client-side operations.')
}


