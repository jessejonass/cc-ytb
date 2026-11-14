import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/tmdb/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/tmdb/client')>('@/lib/tmdb/client')
  return { ...actual, tmdbFetch: fetchMock }
})

import { TmdbNotFoundError } from '@/lib/tmdb/client'
import {
  getByProvider,
  getMovieDetail,
  getTopRated,
  getTrendingAvailable,
  pickHero,
  searchMovies,
  toMovieCard,
  type MovieCard,
} from '@/lib/tmdb/movies'

const summary = (id: number) => ({
  id,
  title: `Filme ${id}`,
  overview: '',
  poster_path: '/p.jpg',
  backdrop_path: '/b.jpg',
  release_date: '2020-05-01',
  vote_average: 8.4,
  vote_count: 1000,
  genre_ids: [],
})
const prov = (id: number, name: string) => ({ provider_id: id, provider_name: name, logo_path: null, display_priority: id })
const card = (o: Partial<MovieCard>): MovieCard => ({
  id: 1, title: 't', posterPath: null, backdropPath: null, overview: '', year: null, rating: 'Sem nota', ...o,
})

beforeEach(() => {
  fetchMock.mockReset()
})

describe('toMovieCard', () => {
  it('mapeia campos e disponibilidade', () => {
    const c = toMovieCard(summary(1), {
      available: true, link: null, kinds: ['flatrate', 'rent'],
      groups: [
        { kind: 'flatrate', label: 'Assinatura', providers: [{ id: 8, name: 'Netflix', logoPath: null }] },
        { kind: 'rent', label: 'Aluguel', providers: [{ id: 8, name: 'Netflix', logoPath: null }, { id: 2, name: 'Apple TV', logoPath: null }] },
      ],
    })
    expect(c).toMatchObject({ id: 1, year: '2020', rating: '8,4', kinds: ['flatrate', 'rent'], providerNames: ['Netflix', 'Apple TV'] })
  })
})

describe('getTrendingAvailable', () => {
  it('mantém só filmes com BR e preserva ordem', async () => {
    fetchMock.mockImplementation(async (path: string, params: Record<string, unknown>) => {
      if (path === '/trending/movie/week') {
        return params.page === 1
          ? { page: 1, results: [summary(1), summary(2)], total_pages: 2, total_results: 3 }
          : { page: 2, results: [summary(3)], total_pages: 2, total_results: 3 }
      }
      if (path === '/movie/1/watch/providers') return { results: { BR: { flatrate: [prov(8, 'Netflix')] } } }
      if (path === '/movie/2/watch/providers') return { results: { US: { flatrate: [prov(8, 'Netflix')] } } }
      if (path === '/movie/3/watch/providers') return { results: { BR: { buy: [prov(2, 'Apple TV')] } } }
      throw new Error(path)
    })
    const r = await getTrendingAvailable()
    expect(r.map((c) => c.id)).toEqual([1, 3])
    expect(r[0].kinds).toEqual(['flatrate'])
    expect(r[1].providerNames).toEqual(['Apple TV'])
  })
})

describe('pickHero', () => {
  it('pula sem backdrop', () => {
    expect(pickHero([card({ id: 1, backdropPath: null }), card({ id: 2, backdropPath: '/b.jpg' })])?.id).toBe(2)
    expect(pickHero([])).toBeNull()
  })
})

describe('discover', () => {
  it('getTopRated envia params', async () => {
    fetchMock.mockImplementation(async (path: string) => {
      if (path === '/watch/providers/movie') return { results: [prov(8, 'Netflix'), prov(119, 'Prime')] }
      return { page: 1, results: [summary(1)], total_pages: 1, total_results: 1 }
    })
    const r = await getTopRated()
    expect(r).toHaveLength(1)
    const call = fetchMock.mock.calls.find((c) => c[0] === '/discover/movie')!
    expect(call[1]).toMatchObject({ watch_region: 'BR', with_watch_providers: '8|119', sort_by: 'vote_average.desc', 'vote_count.gte': 300 })
    expect(call[1]).not.toHaveProperty('with_watch_monetization_types')
    expect(call[2]).toBe(3600)
  })

  it('getByProvider', async () => {
    fetchMock.mockResolvedValue({ page: 1, results: [summary(1)], total_pages: 1, total_results: 1 })
    await getByProvider(8)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ watch_region: 'BR', with_watch_providers: 8, sort_by: 'popularity.desc' })
  })
})

describe('getMovieDetail', () => {
  it('id inválido retorna null sem fetch', async () => {
    expect(await getMovieDetail('abc')).toBeNull()
    expect(await getMovieDetail('0')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('NotFound retorna null', async () => {
    fetchMock.mockRejectedValue(new TmdbNotFoundError())
    expect(await getMovieDetail('5')).toBeNull()
  })

  it('detalhe completo', async () => {
    fetchMock.mockResolvedValue({
      ...summary(7), runtime: 139, genres: [{ id: 1, name: 'Drama' }],
      credits: {
        cast: Array.from({ length: 15 }, (_, i) => ({ id: i, name: `A${i}`, character: `C${i}`, profile_path: null })),
        crew: [{ id: 1, name: 'David Fincher', job: 'Director', department: 'Directing' }, { id: 2, name: 'X', job: 'Writer', department: 'Writing' }],
      },
      videos: { results: [{ id: 'a', key: 'Z', name: 'n', site: 'Vimeo', type: 'Trailer' }, { id: 'b', key: 'K', name: 'n', site: 'YouTube', type: 'Trailer' }] },
      'watch/providers': { results: { BR: { flatrate: [prov(8, 'Netflix')] } } },
      recommendations: { page: 1, results: [summary(9)], total_pages: 1, total_results: 1 },
    })
    const d = (await getMovieDetail('7'))!
    expect(fetchMock.mock.calls[0][0]).toBe('/movie/7')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ append_to_response: 'credits,videos,watch/providers,recommendations' })
    expect(fetchMock.mock.calls[0][2]).toBe(86400)
    expect(d.directors).toEqual(['David Fincher'])
    expect(d.trailerUrl).toBe('https://www.youtube.com/watch?v=K')
    expect(d.cast.length).toBeLessThanOrEqual(10)
    expect(d.rating).toBe('8,4')
    expect(d.runtime).toBe('2h 19min')
    expect(d.genres).toEqual(['Drama'])
    expect(d.availability.available).toBe(true)
    expect(d.recommendations.map((r) => r.id)).toEqual([9])
  })
})

describe('searchMovies', () => {
  it('vazio sem fetch', async () => {
    expect(await searchMovies('   ', 1)).toEqual({ page: 1, results: [], total_pages: 0, total_results: 0 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('busca', async () => {
    fetchMock.mockResolvedValue({ page: 2, results: [summary(1)], total_pages: 3, total_results: 50 })
    const r = await searchMovies(' matrix ', 2)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ query: 'matrix', page: 2, include_adult: 'false' })
    expect(r.results[0].id).toBe(1)
    expect(r.total_pages).toBe(3)
  })
})
