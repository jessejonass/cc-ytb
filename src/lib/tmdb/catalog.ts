// Funções puras (sem server-only): também usadas pelo componente cliente CatalogFilters.
export type CatalogSort = 'popularidade' | 'nota' | 'lancamento'

export type CatalogFilters = {
  providers: number[]
  genres: number[]
  from: number | null
  to: number | null
  minRating: number | null
  sort: CatalogSort
  page: number
}

type SearchParams = Record<string, string | string[] | undefined>

const SORTS: CatalogSort[] = ['popularidade', 'nota', 'lancamento']

/** Notas mínimas aceitas em ?nota= (com piso de votos no discover). */
export const MIN_RATINGS = [6, 7, 8] as const

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function parseMinRating(v: string | string[] | undefined): number | null {
  const raw = first(v)
  return MIN_RATINGS.find((r) => String(r) === raw) ?? null
}

function parseIds(v: string | string[] | undefined): number[] {
  const raw = first(v)
  if (!raw) return []
  return raw
    .split(',')
    .filter((s) => /^\d+$/.test(s.trim()) && Number(s) > 0)
    .map(Number)
}

function parseYear(v: string | string[] | undefined): number | null {
  const raw = first(v)
  if (!raw || !/^\d+$/.test(raw)) return null
  const n = Number(raw)
  return n >= 1900 && n <= new Date().getFullYear() + 1 ? n : null
}

export function parsePage(v: string | string[] | undefined): number {
  const raw = first(v)
  if (!raw || !/^\d+$/.test(raw)) return 1
  const n = Number(raw)
  if (n <= 0) return 1
  return Math.min(n, 500)
}

export function parseCatalogFilters(sp: SearchParams): CatalogFilters {
  const ordem = first(sp.ordem)
  return {
    providers: parseIds(sp.servicos),
    genres: parseIds(sp.generos),
    from: parseYear(sp.de),
    to: parseYear(sp.ate),
    minRating: parseMinRating(sp.nota),
    sort: SORTS.find((s) => s === ordem) ?? 'popularidade',
    page: parsePage(sp.pagina),
  }
}

export function buildDiscoverParams(
  f: CatalogFilters,
  allBrProviderIds: number[],
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    watch_region: 'BR',
    with_watch_providers: (f.providers.length > 0 ? f.providers : allBrProviderIds).join('|'),
  }
  if (f.genres.length > 0) params.with_genres = f.genres.join('|')
  if (f.from !== null) params['primary_release_date.gte'] = `${f.from}-01-01`
  if (f.to !== null) params['primary_release_date.lte'] = `${f.to}-12-31`
  if (f.minRating !== null) params['vote_average.gte'] = f.minRating
  if (f.minRating !== null || f.sort === 'nota') params['vote_count.gte'] = 100
  if (f.sort === 'popularidade') params.sort_by = 'popularity.desc'
  else if (f.sort === 'nota') params.sort_by = 'vote_average.desc'
  else params.sort_by = 'primary_release_date.desc'
  params.page = f.page
  return params
}

export function buildCatalogUrl(f: CatalogFilters): string {
  const p = new URLSearchParams()
  if (f.providers.length) p.set('servicos', f.providers.join(','))
  if (f.genres.length) p.set('generos', f.genres.join(','))
  if (f.from !== null) p.set('de', String(f.from))
  if (f.to !== null) p.set('ate', String(f.to))
  if (f.minRating !== null) p.set('nota', String(f.minRating))
  if (f.sort !== 'popularidade') p.set('ordem', f.sort)
  if (f.page > 1) p.set('pagina', String(f.page))
  const qs = p.toString()
  return qs ? `/catalogo?${qs}` : '/catalogo'
}

// "to: null" na década atual: parseYear rejeita anos além do ano atual + 1.
export const DECADES: { label: string; from: number | null; to: number | null }[] = [
  { label: '2020', from: 2020, to: null },
  { label: '2010', from: 2010, to: 2019 },
  { label: '2000', from: 2000, to: 2009 },
  { label: '1990', from: 1990, to: 1999 },
  { label: '1980', from: 1980, to: 1989 },
  { label: '1970', from: 1970, to: 1979 },
  { label: 'Antes de 1970', from: null, to: 1969 },
]
