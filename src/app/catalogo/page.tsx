import type { Metadata } from 'next'
import { CatalogFilters } from '@/components/CatalogFilters'
import { Pagination } from '@/components/Pagination'
import { PosterGrid } from '@/components/PosterGrid'
import { FEATURED_PROVIDERS } from '@/lib/providers'
import { buildCatalogUrl, parseCatalogFilters } from '@/lib/tmdb/catalog'
import { discoverCatalog, getBrProviders, getGenres } from '@/lib/tmdb/movies'

export const metadata: Metadata = { title: 'Catálogo' }

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseCatalogFilters(await searchParams)
  const [result, genres, providers] = await Promise.all([
    discoverCatalog(filters),
    getGenres(),
    getBrProviders().catch(() => []),
  ])

  const featuredIds = new Set(FEATURED_PROVIDERS.map((p) => p.id))
  const others = providers
    .filter((p) => !featuredIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Catálogo</h1>
      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <CatalogFilters
          filters={filters}
          featured={FEATURED_PROVIDERS.map((p) => ({ id: p.id, name: p.name }))}
          others={others}
          genres={genres}
        />
        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-muted">
            {result.total_results.toLocaleString('pt-BR')} filmes
          </p>
          <PosterGrid
            movies={result.results}
            emptyText="Nenhum filme encontrado com esses filtros."
          />
          <Pagination
            page={filters.page}
            totalPages={result.total_pages}
            hrefFor={(p) => buildCatalogUrl({ ...filters, page: p })}
          />
        </div>
      </div>
    </div>
  )
}
