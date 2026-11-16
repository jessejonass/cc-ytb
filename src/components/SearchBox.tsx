'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Search } from './icons'

/** Formulário de busca sem hooks: usado também como fallback do Suspense (sem layout shift). */
export function SearchForm({ q }: { q: string }) {
  return (
    <form action="/busca" method="get" role="search" className="group relative w-full sm:w-56 lg:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-fg/50 transition-colors group-focus-within:text-accent" />
      <input
        key={q}
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Buscar filme…"
        aria-label="Buscar filme"
        className="w-full rounded-full glass py-2 pr-4 pl-10 text-sm text-fg transition-[background-color,border-color,box-shadow] placeholder:text-fg/45 focus:border-accent/60 focus:bg-black/40 focus:shadow-[0_0_0_4px_rgb(244_179_61/0.15)] focus:outline-none"
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
