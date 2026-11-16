'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  buildCatalogUrl,
  DECADES,
  type CatalogFilters as Filters,
  type CatalogSort,
} from '@/lib/tmdb/catalog'

type Named = { id: number; name: string }

function toggle(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export function CatalogFilters({
  filters,
  featured,
  others,
  genres,
}: {
  filters: Filters
  featured: Named[]
  others: Named[]
  genres: Named[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function update(patch: Partial<Filters>) {
    router.push(buildCatalogUrl({ ...filters, ...patch, page: 1 }))
  }

  const checkbox = (n: Named, list: number[], key: 'providers' | 'genres') => (
    <label key={n.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-fg/80 transition-colors hover:bg-white/5 hover:text-fg has-checked:text-fg">
      <input
        type="checkbox"
        className="h-4 w-4 accent-accent"
        checked={list.includes(n.id)}
        onChange={() => update({ [key]: toggle(list, n.id) })}
      />
      {n.name}
    </label>
  )

  const heading = 'mb-2.5 mt-7 font-display text-xl font-extrabold tracking-wide text-fg'

  const panel = (
    <div>
      <h3 className={`${heading} mt-0`}>Serviços</h3>
      {featured.map((n) => checkbox(n, filters.providers, 'providers'))}
      {others.length > 0 && (
        <details className="mt-1" open={others.some((o) => filters.providers.includes(o.id))}>
          <summary className="cursor-pointer px-2 py-1 text-sm font-medium text-accent">Mais serviços</summary>
          <div className="mt-1">{others.map((n) => checkbox(n, filters.providers, 'providers'))}</div>
        </details>
      )}

      <h3 className={heading}>Gêneros</h3>
      {genres.map((n) => checkbox(n, filters.genres, 'genres'))}

      <h3 className={heading}>Década</h3>
      <div className="flex flex-wrap gap-2">
        {DECADES.map((d) => {
          const active = filters.from === d.from && filters.to === d.to
          return (
            <button
              key={d.label}
              type="button"
              aria-pressed={active}
              onClick={() =>
                active ? update({ from: null, to: null }) : update({ from: d.from, to: d.to })
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? 'border-transparent btn-light' : 'border-white/15 text-fg/80 hover:border-accent/70 hover:text-fg'
              }`}
            >
              {d.label}
            </button>
          )
        })}
      </div>

      <h3 className={heading}>Ordenar por</h3>
      <select
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value as CatalogSort })}
        className="w-full rounded-xl border border-white/15 bg-panel px-3 py-2.5 text-sm focus:border-accent/60 focus:outline-none"
      >
        <option value="popularidade">Popularidade</option>
        <option value="nota">Nota</option>
        <option value="lancamento">Lançamento</option>
      </select>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full glass px-5 py-2 text-sm font-medium md:hidden"
      >
        Filtros
      </button>

      <aside className="no-scrollbar sticky top-[calc(var(--header-h)+1rem)] hidden max-h-[calc(100svh-var(--header-h)-2rem)] w-64 shrink-0 self-start overflow-y-auto rounded-2xl bg-panel/60 p-5 ring-1 ring-white/[0.07] backdrop-blur-md md:block" aria-label="Filtros">
        {panel}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[88%] animate-rise overflow-y-auto bg-panel p-6 shadow-2xl ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-2xl font-black">Filtros</span>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-accent">
                Fechar
              </button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </>
  )
}
