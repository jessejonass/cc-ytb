'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  buildCatalogUrl,
  type CatalogFilters as Filters,
  type CatalogSort,
} from '@/lib/tmdb/catalog'

type Named = { id: number; name: string }

const DECADES: { label: string; from: number | null; to: number }[] = [
  { label: '2020', from: 2020, to: 2029 },
  { label: '2010', from: 2010, to: 2019 },
  { label: '2000', from: 2000, to: 2009 },
  { label: '1990', from: 1990, to: 1999 },
  { label: '1980', from: 1980, to: 1989 },
  { label: '1970', from: 1970, to: 1979 },
  { label: 'Antes de 1970', from: null, to: 1969 },
]

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
    <label key={n.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
      <input
        type="checkbox"
        className="accent-accent"
        checked={list.includes(n.id)}
        onChange={() => update({ [key]: toggle(list, n.id) })}
      />
      {n.name}
    </label>
  )

  const heading = 'mb-2 mt-5 font-display text-sm font-bold uppercase tracking-wide text-muted'

  const panel = (
    <div>
      <h3 className={`${heading} mt-0`}>Serviços</h3>
      {featured.map((n) => checkbox(n, filters.providers, 'providers'))}
      {others.length > 0 && (
        <details className="mt-1" open={others.some((o) => filters.providers.includes(o.id))}>
          <summary className="cursor-pointer text-sm text-accent">Mais serviços</summary>
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
              className={`rounded-full border px-3 py-1 text-xs ${
                active ? 'border-accent bg-accent text-bg' : 'border-white/15 hover:border-accent'
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
        className="w-full rounded-lg border border-white/15 bg-panel px-3 py-2 text-sm"
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
        className="self-start rounded-lg border border-white/15 bg-panel px-4 py-2 text-sm md:hidden"
      >
        Filtros
      </button>

      <aside className="hidden w-60 shrink-0 md:block" aria-label="Filtros">
        {panel}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-lg font-bold">Filtros</span>
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
