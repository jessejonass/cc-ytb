import Link from 'next/link'
import { buildCatalogUrl, parseCatalogFilters, type MinRating } from '@/lib/tmdb/catalog'

/** Atalhos da inicial para o Catálogo filtrado por nota mínima e ordenado por nota. */
export function RatingShortcuts({ ratings = [7, 8] }: { ratings?: readonly MinRating[] }) {
  const defaults = parseCatalogFilters({})
  return (
    <div className="flex items-center gap-1.5">
      {ratings.map((r) => (
        <Link
          key={r}
          href={buildCatalogUrl({ ...defaults, minRating: r, sort: 'nota' })}
          className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-medium text-fg/80 transition-colors hover:border-accent/70 hover:text-accent"
        >
          {r}+<span className="sr-only"> — filmes com nota {r} ou mais</span>
        </Link>
      ))}
    </div>
  )
}
