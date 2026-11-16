'use server'

import { redirect } from 'next/navigation'
import { safeNextPath } from '@/lib/auth'
import { parseCredentials } from '@/lib/credentials'
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server'

/** `email` volta para o formulário reexibir o que foi digitado após um erro. */
export type AuthFormState = { error: string | null; email: string }

const UNAVAILABLE = 'Login indisponível: configure o Supabase.'
const SIGN_IN_FAILED = 'Não foi possível entrar. Tente de novo.'
const SIGN_UP_FAILED = 'Não foi possível criar a conta. Tente de novo.'
// Só acontece se "Confirm email" estiver ligado no Supabase (o projeto pede desligado).
const NEEDS_CONFIRM =
  'Sua conta precisa de confirmação por e-mail. Desligue "Confirm email" no Supabase (Authentication → Sign In / Providers → Email).'

function typedEmail(formData: FormData): string {
  const raw = formData.get('email')
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

export async function signInWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = typedEmail(formData)
  if (!isSupabaseConfigured()) return { error: UNAVAILABLE, email }
  const c = parseCredentials(formData, 'entrar')
  if (!c.ok) return { error: c.error, email }
  try {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email: c.email, password: c.password })
    if (error) {
      if (error.code === 'invalid_credentials') return { error: 'E-mail ou senha incorretos.', email }
      if (error.code === 'email_not_confirmed') return { error: NEEDS_CONFIRM, email }
      return { error: SIGN_IN_FAILED, email }
    }
  } catch {
    return { error: SIGN_IN_FAILED, email }
  }
  // fora do try: redirect() lança para o Next tratar
  redirect(safeNextPath(formData.get('next')))
}

export async function signUpWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = typedEmail(formData)
  if (!isSupabaseConfigured()) return { error: UNAVAILABLE, email }
  const c = parseCredentials(formData, 'criar')
  if (!c.ok) return { error: c.error, email }
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.auth.signUp({ email: c.email, password: c.password })
    if (error) {
      return {
        error: error.code === 'user_already_exists' ? 'Este e-mail já tem conta.' : SIGN_UP_FAILED,
        email,
      }
    }
    // sem sessão = o Supabase está exigindo confirmação: não fingir que a pessoa entrou
    if (!data.session) return { error: NEEDS_CONFIRM, email }
  } catch {
    return { error: SIGN_UP_FAILED, email }
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
