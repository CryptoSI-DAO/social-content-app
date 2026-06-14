import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use @supabase/ssr browser client so sessions are stored in COOKIES
// (not just localStorage). This makes them visible to middleware/SSR.
// Returns null if env vars missing (demo mode).
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null
