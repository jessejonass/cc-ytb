'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server'

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()
  }
  redirect('/')
}
