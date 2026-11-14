import { redirect } from 'next/navigation'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { safeNextPath } from '@/lib/auth'
import { getCurrentUser, isSupabaseConfigured } from '@/lib/supabase/server'

export const metadata = { title: 'Entrar — CINE' }

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>
}) {
  const sp = await searchParams
  const next = safeNextPath(sp.next)
  if (await getCurrentUser()) redirect(next)

  return (
    <section className="mx-auto max-w-sm py-12 text-center">
      <h1 className="font-display text-2xl font-extrabold">Entrar</h1>
      <p className="mt-2 text-sm text-muted">Entre com sua conta Google para salvar favoritos.</p>
      {sp.erro && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          Não foi possível entrar. Tente de novo.
        </p>
      )}
      <div className="mt-6">
        {isSupabaseConfigured() ? (
          <GoogleSignInButton next={next} />
        ) : (
          <p className="text-sm text-muted">Login indisponível: configure o Supabase.</p>
        )}
      </div>
    </section>
  )
}
