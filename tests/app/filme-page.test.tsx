import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MovieDetail } from '@/lib/tmdb/movies'

const data = vi.hoisted(() => ({ movie: null as unknown }))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/filme/7',
}))
vi.mock('@/app/actions/favorites', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }))
vi.mock('@/lib/favorites', () => ({ getFavoriteIds: async () => new Set<number>() }))
vi.mock('@/app/actions/watch-status', () => ({ setWatchStatus: vi.fn(), clearWatchStatus: vi.fn() }))
vi.mock('@/lib/watch-status', () => ({ getWatchStatus: async () => null }))
vi.mock('@/lib/supabase/server', () => ({ getCurrentUser: async () => null }))
vi.mock('@/lib/tmdb/movies', () => ({ getMovieDetail: async () => data.movie }))

import FilmePage from '@/app/filme/[id]/page'

function detail(o: Partial<MovieDetail> = {}): MovieDetail {
  return {
    id: 7,
    title: 'Duna',
    posterPath: null,
    backdropPath: null,
    overview: 'Sinopse',
    year: '2021',
    rating: '8,1',
    runtime: '2h 35min',
    genres: ['Ficção científica'],
    voteCount: 1234,
    cast: [],
    directors: [],
    trailerUrl: null,
    availability: { available: false, link: null, kinds: [], groups: [] },
    recommendations: [],
    ...o,
  }
}

async function renderPage() {
  render(await FilmePage({ params: Promise.resolve({ id: '7' }) }))
}

describe('FilmePage nota', () => {
  beforeEach(() => {
    data.movie = detail()
  })

  it('com nota mostra ★ e a contagem de votos', async () => {
    await renderPage()
    expect(screen.getByText('★ 8,1')).toBeInTheDocument()
    expect(screen.getByText('(1.234 votos)')).toBeInTheDocument()
  })

  it('sem nota mostra "Sem nota" sem ★ e sem votos', async () => {
    data.movie = detail({ rating: 'Sem nota', voteCount: 0 })
    await renderPage()
    expect(screen.getByText('Sem nota')).toBeInTheDocument()
    expect(screen.queryByText(/★/)).toBeNull()
    expect(screen.queryByText(/votos/)).toBeNull()
  })
})
