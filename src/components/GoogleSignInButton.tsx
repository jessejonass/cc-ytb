'use client'

import { createBrowserSupabase } from '@/lib/supabase/client'

export default function GoogleSignInButton({ next }: { next: string }) {
  async function signIn() {
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    await createBrowserSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${base}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }
  return (
    <button
      type="button"
      onClick={signIn}
      className="w-full rounded-full btn-light px-6 py-3 font-semibold transition-transform hover:scale-[1.03] active:scale-95"
    >
      Entrar com Google
    </button>
  )
}
