import { createBrowserClient } from '@supabase/ssr'
import { supabaseKey } from './env'

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey()!,
  )
}
