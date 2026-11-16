import Link from 'next/link'
import { ChevronLeft, ChevronRight } from './icons'

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number
  totalPages: number
  hrefFor: (p: number) => string
}) {
  if (totalPages <= 1) return null
  const cls =
    'inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-medium transition-[transform,border-color,background-color]'
  const live = `${cls} hover:scale-[1.04] hover:border-accent/60 hover:bg-white/15`
  return (
    <nav aria-label="Paginação" className="mt-12 flex items-center justify-center gap-3 sm:gap-5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={live}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Link>
      ) : (
        <span className={`${cls} opacity-35`}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </span>
      )}
      <span className="text-sm text-muted tabular-nums">
        Página <span className="font-semibold text-fg">{page}</span> de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={live}>
          Próxima <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${cls} opacity-35`}>
          Próxima <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
