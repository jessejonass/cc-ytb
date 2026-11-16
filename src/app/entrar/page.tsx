import { redirect } from 'next/navigation'
import { EmailAuthForm } from '@/components/EmailAuthForm'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { safeNextPath } from '@/lib/auth'
import { getCurrentUser, isSupabaseConfigured } from '@/lib/supabase/server'

export const metadata = { title: 'Entrar — CINE' }

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; erro?: string | string[] }>
}) {
  const sp = await searchParams
  // ?next=a&next=b chega como array: usa o primeiro
  const next = safeNextPath(Array.isArray(sp.next) ? sp.next[0] : sp.next)
  if (await getCurrentUser()) redirect(next)

  return (
    <section className="relative isolate flex min-h-[70svh] items-center justify-center px-(--gutter) py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(244_179_61/0.22),rgb(232_87_42/0.1)_55%,transparent)] blur-2xl"
      />
      <div className="w-full max-w-sm animate-rise rounded-3xl bg-panel/70 p-8 text-center ring-1 ring-white/10 backdrop-blur-xl sm:p-10">
        <h1 className="font-display text-5xl leading-none font-black uppercase">Entrar</h1>
        <p className="mt-3 text-sm text-fg/70">Entre para salvar favoritos e montar suas listas.</p>
        {sp.erro && (
          <p role="alert" className="mt-5 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/30">
            Não foi possível entrar. Tente de novo.
          </p>
        )}
        <div className="mt-8">
          {isSupabaseConfigured() ? (
            <>
              <EmailAuthForm next={next} />
              {process.env.NEXT_PUBLIC_GOOGLE_LOGIN === '1' && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted" aria-hidden>
                    <span className="h-px flex-1 bg-white/10" />
                    ou
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <GoogleSignInButton next={next} />
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">Login indisponível: configure o Supabase.</p>
          )}
        </div>
      </div>
    </section>
  )
}
