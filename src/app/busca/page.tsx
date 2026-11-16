import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
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
      <div className="mx-auto max-w-[1680px] px-(--gutter) pb-16">
        <PageHeader title="Busca" />
        <p className="rounded-2xl border border-dashed border-white/10 py-20 text-center text-muted">
          Digite o nome de um filme
        </p>
      </div>
    )
  }

  const result = await searchMovies(q, page)

  return (
    <div className="mx-auto max-w-[1680px] px-(--gutter) pb-16">
      <PageHeader title={`Resultados para “${q}”`}>
        {result.total_results.toLocaleString('pt-BR')} filmes encontrados
      </PageHeader>
      <div className="mt-2">
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
