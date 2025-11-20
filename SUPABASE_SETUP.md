# Supabase + Drizzle ORM Integration Guide

This project combines **Supabase** (for auth, real-time, storage) with **Drizzle ORM** (for type-safe database queries). Here's how to set it up and use it.

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Database URL (for Drizzle ORM - use Supabase connection string)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# OpenAI (if needed)
OPENAI_API_KEY=your_openai_api_key
```

### 2. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (keep this secret!)
5. Go to **Settings** → **Database** → **Connection string** → **URI**
   - Copy the connection string → `DATABASE_URL`

### 3. Enable Google OAuth

1. In the Supabase dashboard open **Authentication → Providers → Google**
2. Add your Google OAuth **Client ID** and **Client secret**
   - Create credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Authorized redirect URI should match your app URL (for local dev: `http://localhost:3000`)
3. Enable the Google provider and click **Save**
4. In **Project Settings → General**, set **Site URL** to your local/production domain so Supabase knows where to redirect after login

## Usage

### 🎯 Recommended: Combined Drizzle + Supabase (Server-Side)

The best approach is to use **Drizzle for type-safe queries** and **Supabase for auth, real-time, and storage**:

```typescript
// server/api/users.ts
import { getDatabase } from '~/server/utils/database'
import { users } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { db, supabase, schema } = getDatabase()
  
  // Use Drizzle for type-safe queries
  const allUsers = await db.select().from(users)
  
  // Use Drizzle with conditions
  const students = await db
    .select()
    .from(users)
    .where(eq(users.role, 'student'))
  
  // Use Supabase for authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  // Insert with Drizzle (fully type-safe)
  const newUser = await db.insert(users).values({
    email: 'test@example.com',
    name: 'Test User',
    role: 'student'
  }).returning()
  
  return { allUsers, students, newUser }
})
```

**Benefits of this approach:**
- ✅ **Type-safe queries** with Drizzle (autocomplete, type checking)
- ✅ **Supabase features** (auth, real-time, storage) when needed
- ✅ **Connection pooling** for better performance
- ✅ **Single source of truth** for your schema

### Client-Side (Components/Pages)

Use the `useSupabase` composable in your Vue components:

```vue
<script setup>
const supabase = useSupabase()

// Example: Fetch data
const { data, error } = await supabase
  .from('users')
  .select('*')

// Example: Insert data
const { data, error } = await supabase
  .from('users')
  .insert({ email: 'user@example.com', name: 'John Doe' })

// Example: Authentication
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
</script>
```

### Google Login Page (`pages/index.vue`)

The default landing page in this repo demonstrates Google OAuth with Supabase:

```vue
<script setup lang="ts">
const supabase = useSupabase()
const user = ref(null)

const loginWithGoogle = async () => {
  const redirectTo = `${window.location.origin}`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })
  if (error) console.error(error)
}

const logout = async () => {
  await supabase.auth.signOut()
}
</script>
```

Key behaviors implemented in `pages/index.vue`:

- `supabase.auth.getSession()` runs on mount to hydrate the UI with the current user
- `supabase.auth.onAuthStateChange()` keeps local state in sync when Supabase updates the session
- The Google button calls `signInWithOAuth({ provider: 'google' })` and redirects back to the same origin
- Signed-in state shows the profile plus a `Sign out` button calling `supabase.auth.signOut()`

### Server-Side Options

#### Option 1: Unified Database Utility (Recommended)

```typescript
// server/api/users.ts
import { getDatabase } from '~/server/utils/database'
import { users } from '~/server/database/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { db, supabase } = getDatabase()
  
  // Drizzle: Type-safe queries
  const allUsers = await db.select().from(users)
  
  // Drizzle: Complex queries with joins
  const usersWithGroups = await db
    .select()
    .from(users)
    .leftJoin(groups, eq(users.id, groups.teacherId))
  
  // Supabase: Authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  return { allUsers, usersWithGroups, currentUser: user }
})
```

#### Option 2: Individual Utilities

```typescript
// For Drizzle only
import { getDrizzleDb } from '~/server/utils/database'
import { users } from '~/server/database/schema'

const db = getDrizzleDb()
const allUsers = await db.select().from(users)

// For Supabase only
import { getSupabaseClient } from '~/server/utils/database'

const supabase = getSupabaseClient()
const { data } = await supabase.from('users').select('*')
```

### Server Utilities

For server utilities and middleware:

```typescript
// server/utils/my-utility.ts
import { getDatabase } from '~/server/utils/database'
import { users } from '~/server/database/schema'

export async function myFunction() {
  const { db, supabase } = getDatabase()
  
  // Use Drizzle for queries
  const users = await db.select().from(users)
  
  // Use Supabase for auth/storage
  const { data } = await supabase.auth.admin.listUsers()
  
  return { users, authUsers: data }
}
```

## Important Notes

- **Service Role Key**: The `SUPABASE_SERVICE_KEY` bypasses Row Level Security (RLS). Only use it server-side and never expose it to the client.
- **Anon Key**: The `SUPABASE_ANON_KEY` respects RLS policies and is safe to use client-side.
- **Authentication**: Supabase handles authentication automatically. User sessions are managed through cookies when using the client-side composable.

## Examples: Full CRUD Operations

### Server-Side with Drizzle (Type-Safe)

```typescript
// server/api/users.ts
import { getDatabase } from '~/server/utils/database'
import { users } from '~/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { db } = getDatabase()
  
  // Create
  const newUser = await db.insert(users).values({
    email: 'new@example.com',
    name: 'New User',
    role: 'student'
  }).returning()
  
  // Read
  const allUsers = await db.select().from(users)
  
  // Read with condition
  const student = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  
  // Update
  const updated = await db
    .update(users)
    .set({ name: 'Updated Name' })
    .where(eq(users.id, userId))
    .returning()
  
  // Delete
  const deleted = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning()
  
  return { newUser, allUsers, student, updated, deleted }
})
```

### Client-Side with Supabase

```vue
<script setup>
const supabase = useSupabase()

// Create
async function createUser() {
  const { data, error } = await supabase
    .from('users')
    .insert({ email: 'new@example.com', name: 'New User' })
    .select()
  
  if (error) console.error(error)
  else console.log('Created:', data)
}

// Read
async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) console.error(error)
  else console.log('Users:', data)
}

// Update
async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
  
  if (error) console.error(error)
  else console.log('Updated:', data)
}

// Delete
async function deleteUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
  
  if (error) console.error(error)
  else console.log('Deleted:', data)
}
</script>
```

## When to Use What?

| Use Case | Tool | Why |
|----------|------|-----|
| Type-safe database queries | **Drizzle** | Full TypeScript support, autocomplete, compile-time checks |
| Authentication | **Supabase** | Built-in auth system |
| Real-time subscriptions | **Supabase** | Real-time features |
| File storage | **Supabase** | Storage API |
| Complex joins & relations | **Drizzle** | Better query builder |
| Migrations | **Drizzle** | Schema management |
| Row Level Security | **Supabase** | RLS policies |

## Database Schema

Your schema is defined in `server/database/schema.ts` using Drizzle. To apply migrations:

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration to Supabase
npx drizzle-kit push
```

Or use the Supabase connection string with Drizzle migrations.

## Next Steps

1. ✅ Set up your database tables using Drizzle migrations (already configured)
2. Configure Row Level Security (RLS) policies in Supabase Dashboard
3. Set up authentication using Supabase Auth
4. Use Drizzle for type-safe queries in your API routes
5. Use Supabase for auth, real-time, and storage features
6. Start building your application!

## Available Utilities

- `getDatabase()` - Get both Drizzle and Supabase instances (recommended)
- `getDrizzleDb()` - Get Drizzle instance only
- `getSupabaseClient()` - Get Supabase client only (server-side)
- `useSupabase()` - Get Supabase client (client-side composable)
- `useDatabase()` - Get database utilities (server-side composable)

