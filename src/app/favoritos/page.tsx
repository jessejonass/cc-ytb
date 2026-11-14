import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {movies.length === 0 ? (
        <div className="py-16 text-center">
          <h1 className="mb-4 font-display text-2xl font-bold">Meus favoritos</h1>
          <p className="text-muted">Você ainda não favoritou nenhum filme.</p>
          <Link href="/" className="mt-4 inline-block text-accent hover:underline">
            Ver a Vitrine
          </Link>
        </div>
      ) : (
        <>
          <h1 className="mb-6 font-display text-2xl font-bold">{`Meus favoritos (${movies.length})`}</h1>
          <PosterGrid movies={movies} emptyText="Você ainda não favoritou nenhum filme." />
        </>
      )}
    </div>
  )
}
