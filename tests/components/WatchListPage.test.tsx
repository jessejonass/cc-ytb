import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MovieCard } from '@/lib/tmdb/movies'

const data = vi.hoisted(() => ({
  user: null as { id: string; name: string; avatarUrl: null } | null,
  movies: [] as MovieCard[],
  listByStatus: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ getCurrentUser: async () => data.user }))
vi.mock('@/lib/watch-status', () => ({ listByStatus: data.listByStatus }))

import { WatchListPage } from '@/components/WatchListPage'

const card = (id: number, title: string): MovieCard => ({
  id,
  title,
  posterPath: null,
  backdropPath: null,
  overview: '',
  year: '2020',
  rating: '',
})

describe('WatchListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    data.user = null
    data.listByStatus.mockImplementation(async () => data.movies)
    data.movies = []
  })

  it('sem login convida a entrar, sem buscar a lista', async () => {
    render(await WatchListPage({ status: 'quero' }))
    expect(screen.getByText('Entre para montar sua lista')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar?next=/quero-assistir')
    expect(screen.getByRole('navigation', { name: 'Abas da inicial' })).toBeInTheDocument()
    expect(data.listByStatus).not.toHaveBeenCalled()
  })

  it('sem login em assistidos volta para /assistidos', async () => {
    render(await WatchListPage({ status: 'assistido' }))
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar?next=/assistidos')
  })

  it('lista vazia mostra mensagem e leva ao catálogo', async () => {
    data.user = { id: 'u1', name: 'a@x.com', avatarUrl: null }
    render(await WatchListPage({ status: 'quero' }))
    expect(screen.getByRole('heading', { name: 'Quero assistir' })).toBeInTheDocument()
    expect(screen.getByText('Você ainda não marcou nenhum filme como quero assistir.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute('href', '/catalogo')
    expect(data.listByStatus).toHaveBeenCalledWith('quero')
  })

  it('lista com filmes mostra contagem e títulos', async () => {
    data.user = { id: 'u1', name: 'a@x.com', avatarUrl: null }
    data.movies = [card(1, 'Duna'), card(2, 'Alien')]
    render(await WatchListPage({ status: 'assistido' }))
    expect(screen.getByRole('heading', { name: 'Já assistidos (2)' })).toBeInTheDocument()
    expect(screen.getAllByText('Duna').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Alien').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Já assistidos' })).toHaveAttribute('aria-current', 'page')
  })
})
