import 'server-only'
import { formatRating, formatRuntime, releaseYear } from '@/lib/format'
import { summarizeAvailability, type AccessKind, type Availability } from '@/lib/tmdb/availability'
import { buildDiscoverParams, type CatalogFilters } from '@/lib/tmdb/catalog'
import { TmdbNotFoundError, tmdbFetch } from '@/lib/tmdb/client'
import type {
  TmdbGenre,
  TmdbMovieDetail,
  TmdbMovieSummary,
  TmdbPaged,
  TmdbProvider,
  TmdbWatchRegion,
} from '@/lib/tmdb/types'

export type MovieCard = {
  id: number
  title: string
  posterPath: string | null
  backdropPath: string | null
  overview: string
  year: string | null
  rating: string
  kinds?: AccessKind[]
  providerNames?: string[]
}

export type MovieDetail = MovieCard & {
  runtime: string | null
  genres: string[]
  voteCount: number
  cast: { name: string; character: string; profilePath: string | null }[]
  directors: string[]
  trailerUrl: string | null
  availability: Availability
  recommendations: MovieCard[]
}

const WEEK = 604800
const HOUR = 3600

export function toMovieCard(
  m: Omit<TmdbMovieSummary, 'genre_ids'> & { genre_ids?: number[] },
  availability?: Availability,
): MovieCard {
  const card: MovieCard = {
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    backdropPath: m.backdrop_path,
    overview: m.overview ?? '',
    year: releaseYear(m.release_date),
    rating: formatRating(m.vote_average, m.vote_count),
  }
  if (availability) {
    card.kinds = availability.kinds
    card.providerNames = [
      ...new Set(availability.groups.flatMap((g) => g.providers.map((p) => p.name))),
    ]
  }
  return card
}

export async function getBrProviderIds(): Promise<number[]> {
  const data = await tmdbFetch<{ results: TmdbProvider[] }>(
    '/watch/providers/movie',
    { watch_region: 'BR' },
    WEEK,
  )
  return data.results.map((p) => p.provider_id)
}

export async function getGenres(): Promise<TmdbGenre[]> {
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>('/genre/movie/list', {}, WEEK)
  return data.genres
}

export async function getTrendingAvailable(limit = 20): Promise<MovieCard[]> {
  const pages = await Promise.all(
    [1, 2].map((page) =>
      tmdbFetch<TmdbPaged<TmdbMovieSummary>>('/trending/movie/week', { page }, HOUR),
    ),
  )
  const movies = pages.flatMap((p) => p.results)
  const checked = await Promise.all(
    movies.map(async (m) => {
      const data = await tmdbFetch<{ results: Record<string, TmdbWatchRegion> }>(
        `/movie/${m.id}/watch/providers`,
        {},
        HOUR,
      )
      const availability = summarizeAvailability(data.results.BR)
      return availability.available ? toMovieCard(m, availability) : null
    }),
  )
  return checked.filter((c): c is MovieCard => c !== null).slice(0, limit)
}

export function pickHero(cards: MovieCard[]): MovieCard | null {
  return cards.find((c) => c.backdropPath) ?? null
}

export async function getTopRated(): Promise<MovieCard[]> {
  const ids = await getBrProviderIds()
  const data = await tmdbFetch<TmdbPaged<TmdbMovieSummary>>(
    '/discover/movie',
    {
      watch_region: 'BR',
      with_watch_providers: ids.join('|'),
      sort_by: 'vote_average.desc',
      'vote_count.gte': 300,
    },
    HOUR,
  )
  return data.results.map((m) => toMovieCard(m))
}

export async function getByProvider(providerId: number): Promise<MovieCard[]> {
  const data = await tmdbFetch<TmdbPaged<TmdbMovieSummary>>(
    '/discover/movie',
    {
      watch_region: 'BR',
      with_watch_providers: providerId,
      sort_by: 'popularity.desc',
    },
    HOUR,
  )
  return data.results.map((m) => toMovieCard(m))
}

export async function getMovieDetail(id: string): Promise<MovieDetail | null> {
  if (!/^\d+$/.test(id) || Number(id) <= 0) return null
  let d: TmdbMovieDetail
  try {
    d = await tmdbFetch<TmdbMovieDetail>(
      `/movie/${id}`,
      { append_to_response: 'credits,videos,watch/providers,recommendations' },
      86400,
    )
  } catch (e) {
    if (e instanceof TmdbNotFoundError) return null
    throw e
  }
  const trailer = d.videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
  return {
    ...toMovieCard(d),
    runtime: formatRuntime(d.runtime),
    genres: d.genres.map((g) => g.name),
    voteCount: d.vote_count,
    cast: d.credits.cast.slice(0, 10).map((c) => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    })),
    directors: d.credits.crew.filter((c) => c.job === 'Director').map((c) => c.name),
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    availability: summarizeAvailability(d['watch/providers'].results.BR),
    recommendations: d.recommendations.results.slice(0, 20).map((m) => toMovieCard(m)),
  }
}

export async function searchMovies(
  q: string,
  page: number,
): Promise<TmdbPaged<MovieCard>> {
  const query = q.trim()
  if (!query) return { page: 1, results: [], total_pages: 0, total_results: 0 }
  const data = await tmdbFetch<TmdbPaged<TmdbMovieSummary>>(
    '/search/movie',
    { query, page, include_adult: 'false' },
    21600,
  )
  return { ...data, results: data.results.map((m) => toMovieCard(m)) }
}

export async function getBrProviders(): Promise<{ id: number; name: string }[]> {
  const data = await tmdbFetch<{ results: TmdbProvider[] }>(
    '/watch/providers/movie',
    { watch_region: 'BR' },
    WEEK,
  )
  return data.results.map((p) => ({ id: p.provider_id, name: p.provider_name }))
}

export async function discoverCatalog(f: CatalogFilters): Promise<TmdbPaged<MovieCard>> {
  const ids = f.providers.length > 0 ? [] : await getBrProviderIds()
  const data = await tmdbFetch<TmdbPaged<TmdbMovieSummary>>(
    '/discover/movie',
    buildDiscoverParams(f, ids),
    21600,
  )
  return {
    ...data,
    total_pages: Math.min(data.total_pages, 500),
    results: data.results.map((m) => toMovieCard(m)),
  }
}
