import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { PosterGrid } from '@/components/PosterGrid'
import { listFavorites } from '@/lib/favorites'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Meus favoritos' }
export const dynamic = 'force-dynamic'

export default async function FavoritosPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar?next=/favoritos')
  const movies = await listFavorites()

  return (
    <div className="mx-auto max-w-[1680px] px-(--gutter) pb-16">
      {movies.length === 0 ? (
        <>
          <PageHeader title="Meus favoritos" />
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
            <p className="text-5xl text-accent/70" aria-hidden>
              ♡
            </p>
            <p className="mt-4 text-fg/80">Você ainda não favoritou nenhum filme.</p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full btn-light px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.04]"
            >
              Ver a Vitrine
            </Link>
          </div>
        </>
      ) : (
        <>
          <PageHeader title={`Meus favoritos (${movies.length})`} />
          <PosterGrid movies={movies} emptyText="Você ainda não favoritou nenhum filme." />
        </>
      )}
    </div>
  )
}
