import type { Metadata } from 'next'
import { Pagination } from '@/components/Pagination'
import { PosterGrid } from '@/components/PosterGrid'
import { parsePage } from '@/lib/tmdb/catalog'
import { searchMovies } from '@/lib/tmdb/movies'

export const metadata: Metadata = { title: 'Busca' }

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const q = first(sp.q).trim()
  const page = parsePage(sp.pagina)

  if (!q) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Busca</h1>
        <p className="py-16 text-center text-muted">Digite o nome de um filme</p>
      </div>
    )
  }

  const result = await searchMovies(q, page)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Resultados para “{q}”</h1>
      <div className="mt-6">
        <PosterGrid movies={result.results} emptyText={`Nenhum filme encontrado para “${q}”.`} />
        <Pagination
          page={page}
          totalPages={result.total_pages}
          hrefFor={(p) => `/busca?q=${encodeURIComponent(q)}&pagina=${p}`}
        />
      </div>
    </div>
  )
}
