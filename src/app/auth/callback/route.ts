import { NextResponse, type NextRequest } from 'next/server'
import { safeNextPath } from '@/lib/auth'
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (code && isSupabaseConfigured()) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/entrar?erro=1`)
}
