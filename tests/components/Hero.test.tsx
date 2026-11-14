import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Hero } from '@/components/Hero'
import type { MovieCard } from '@/lib/tmdb/movies'

function card(overrides: Partial<MovieCard> = {}): MovieCard {
  return {
    id: 1,
    title: 'Filme',
    posterPath: '/p.jpg',
    backdropPath: '/b.jpg',
    overview: 'Sinopse',
    year: '2020',
    rating: '7,0',
    ...overrides,
  }
}

describe('Hero', () => {
  it('renders eyebrow and meta line, tolerates empty overview', () => {
    render(
      <Hero
        movie={card({ title: 'Duna', overview: '', rating: '8,1', year: '2021', providerNames: ['Netflix', 'Max'] })}
      />,
    )
    expect(screen.getByText('#1 EM ALTA NA SEMANA')).toBeInTheDocument()
    expect(screen.getByText('2021 · ★ 8,1 · Netflix, Max')).toBeInTheDocument()
    expect(screen.queryByText('undefined')).toBeNull()
  })

  it('unrated shows "Sem nota" without the star', () => {
    render(<Hero movie={card({ rating: 'Sem nota', year: '2021' })} />)
    expect(screen.getByText('2021 · Sem nota')).toBeInTheDocument()
    expect(screen.queryByText(/★/)).toBeNull()
  })

  it('truncates long overview and renders favoriteSlot', () => {
    render(<Hero movie={card({ overview: 'a'.repeat(400) })} favoriteSlot={<button>Fav</button>} />)
    expect(screen.getByText(/^a+…$/).textContent!.length).toBeLessThanOrEqual(201)
    expect(screen.getByText('Fav')).toBeInTheDocument()
  })
})
