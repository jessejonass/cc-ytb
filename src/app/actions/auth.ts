'use server'

import { redirect } from 'next/navigation'
import { safeNextPath } from '@/lib/auth'
import { parseCredentials } from '@/lib/credentials'
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server'

export type AuthFormState = { error: string | null }

const UNAVAILABLE = 'Login indisponível: configure o Supabase.'

export async function signInWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: UNAVAILABLE }
  const c = parseCredentials(formData, 'entrar')
  if (!c.ok) return { error: c.error }
  try {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email: c.email, password: c.password })
    if (error) return { error: 'E-mail ou senha incorretos.' }
  } catch {
    return { error: 'E-mail ou senha incorretos.' }
  }
  // fora do try: redirect() lança para o Next tratar
  redirect(safeNextPath(formData.get('next')))
}

export async function signUpWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: UNAVAILABLE }
  const c = parseCredentials(formData, 'criar')
  if (!c.ok) return { error: c.error }
  try {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.signUp({ email: c.email, password: c.password })
    if (error) {
      return {
        error:
          error.code === 'user_already_exists'
            ? 'Este e-mail já tem conta.'
            : 'Não foi possível criar a conta. Tente de novo.',
      }
    }
  } catch {
    return { error: 'Não foi possível criar a conta. Tente de novo.' }
  }
  redirect(safeNextPath(formData.get('next')))
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()
  }
  redirect('/')
}
