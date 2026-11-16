import Link from 'next/link'
import {
  buildCatalogUrl,
  MIN_RATINGS,
  parseCatalogFilters,
  type MinRating,
} from '@/lib/tmdb/catalog'

/**
 * Barra da inicial: não filtra a inicial, só leva ao Catálogo filtrado por
 * nota mínima e ordenado por nota.
 */
export function RatingShortcuts({ ratings = MIN_RATINGS }: { ratings?: readonly MinRating[] }) {
  const defaults = parseCatalogFilters({})
  return (
    <nav aria-label="Explorar por nota" className="flex flex-wrap items-center gap-x-4 gap-y-2 px-(--gutter)">
      <span aria-hidden className="font-display text-lg font-extrabold tracking-wide text-fg sm:text-xl">
        Explorar por nota
      </span>
      <div className="flex flex-wrap gap-2">
        {ratings.map((r) => (
          <Link
            key={r}
            href={buildCatalogUrl({ ...defaults, minRating: r, sort: 'nota' })}
            className="rounded-full glass px-4 py-1.5 text-sm font-semibold text-fg/90 transition-colors hover:border-accent/70 hover:text-accent"
          >
            <span aria-hidden className="mr-1 text-accent">★</span>
            {r}+<span className="sr-only"> — filmes com nota {r} ou mais</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
