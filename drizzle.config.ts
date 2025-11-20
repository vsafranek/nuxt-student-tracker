import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config()

// Add SSL parameters to the connection string if not already present
// Using 'no-verify' to skip certificate validation for Supabase
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL!
  // If URL doesn't already have sslmode parameter, add it
  if (!url.includes('sslmode=')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}sslmode=no-verify`
  }
  return url
}

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl()
  }
})