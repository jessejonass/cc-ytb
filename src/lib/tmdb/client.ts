import 'server-only'

const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export class TmdbNotFoundError extends Error {
  constructor(message = 'Recurso não encontrado no TMDB') {
    super(message)
    this.name = 'TmdbNotFoundError'
  }
}

export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  revalidate: number,
): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN
  if (!token) throw new Error('TMDB_READ_TOKEN não configurado')

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  search.set('language', 'pt-BR')

  const res = await fetch(`${BASE_URL}${path}?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate },
  })

  if (res.status === 404) throw new TmdbNotFoundError()
  if (!res.ok) throw new Error(`TMDB respondeu com status ${res.status}`)
  return (await res.json()) as T
}

export function imageUrl(
  path: string | null,
  size: 'w342' | 'w780' | 'w1280' | 'original',
): string | null {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null
}
