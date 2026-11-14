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
      className="rounded bg-accent px-5 py-2.5 font-semibold text-bg hover:opacity-90"
    >
      Entrar com Google
    </button>
  )
}
