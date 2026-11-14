import Link from 'next/link'

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
  const cls = 'rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-accent'
  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cls}>
          ← Anterior
        </Link>
      ) : (
        <span className={`${cls} opacity-40`}>← Anterior</span>
      )}
      <span className="text-sm text-muted">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cls}>
          Próxima →
        </Link>
      ) : (
        <span className={`${cls} opacity-40`}>Próxima →</span>
      )}
    </nav>
  )
}
