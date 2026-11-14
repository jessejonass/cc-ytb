'use client'

import { usePathname, useSearchParams } from 'next/navigation'

/** Formulário de busca sem hooks: usado também como fallback do Suspense (sem layout shift). */
export function SearchForm({ q }: { q: string }) {
  return (
    <form action="/busca" method="get" role="search" className="w-full sm:w-64">
      <input
        key={q}
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Buscar filme…"
        aria-label="Buscar filme"
        className="w-full rounded-full bg-panel px-4 py-2 text-sm text-fg placeholder:text-muted focus:outline-2 focus:outline-accent"
      />
    </form>
  )
}

export default function SearchBox() {
  const pathname = usePathname()
  const params = useSearchParams()
  const q = pathname === '/busca' ? (params.get('q') ?? '') : ''
  return <SearchForm q={q} />
}
