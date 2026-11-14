import { cookies } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // chamado de um Server Component: o middleware renova a sessão
          }
        },
      },
    },
  )
}

export async function getCurrentUser(): Promise<{
  id: string
  name: string
  avatarUrl: string | null
} | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) return null
    const meta = user.user_metadata ?? {}
    return {
      id: user.id,
      name: (meta.full_name as string | undefined) || user.email || 'Usuário',
      avatarUrl: (meta.avatar_url as string | undefined) ?? null,
    }
  } catch (e) {
    unstable_rethrow(e)
    return null
  }
}
