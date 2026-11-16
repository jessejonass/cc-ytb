import Link from 'next/link'
import { HomeTabs } from '@/components/HomeTabs'
import { PageHeader } from '@/components/PageHeader'
import { PosterGrid } from '@/components/PosterGrid'
import { getCurrentUser } from '@/lib/supabase/server'
import { listByStatus } from '@/lib/watch-status'
import type { WatchStatus } from '@/lib/watch-status-input'

const COPY: Record<WatchStatus, { title: string; href: string; empty: string; icon: string }> = {
  quero: {
    title: 'Quero assistir',
    href: '/quero-assistir',
    empty: 'Você ainda não marcou nenhum filme como quero assistir.',
    icon: '+',
  },
  assistido: {
    title: 'Já assistidos',
    href: '/assistidos',
    empty: 'Você ainda não marcou nenhum filme como assistido.',
    icon: '✓',
  },
}

function Notice({ icon, text, cta }: { icon: string; text: string; cta: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
      <p className="font-display text-5xl text-accent/70" aria-hidden>
        {icon}
      </p>
      <p className="mt-4 text-fg/80">{text}</p>
      <Link
        href={cta.href}
        className="mt-6 inline-flex rounded-full btn-light px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.04]"
      >
        {cta.label}
      </Link>
    </div>
  )
}

export async function WatchListPage({ status }: { status: WatchStatus }) {
  const copy = COPY[status]
  const user = await getCurrentUser()
  const movies = user ? await listByStatus(status) : []

  return (
    <div className="pt-6 pb-16">
      <HomeTabs active={status} />
      <div className="mx-auto max-w-[1680px] px-(--gutter)">
        {!user ? (
          <>
            <PageHeader title={copy.title} />
            <Notice
              icon={copy.icon}
              text="Entre para montar sua lista"
              cta={{ href: `/entrar?next=${copy.href}`, label: 'Entrar' }}
            />
          </>
        ) : movies.length === 0 ? (
          <>
            <PageHeader title={copy.title} />
            <Notice icon={copy.icon} text={copy.empty} cta={{ href: '/catalogo', label: 'Explorar o catálogo' }} />
          </>
        ) : (
          <>
            <PageHeader title={`${copy.title} (${movies.length})`} />
            <PosterGrid movies={movies} emptyText={copy.empty} />
          </>
        )}
      </div>
    </div>
  )
}
