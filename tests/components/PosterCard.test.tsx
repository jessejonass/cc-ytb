import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PosterCard } from '@/components/PosterCard'
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

describe('PosterCard', () => {
  it('renders link, fallback title, badge, rating', () => {
    render(
      <PosterCard
        movie={card({ id: 7, title: 'Duna', posterPath: null, kinds: ['flatrate'], rating: '8,1', year: '2021' })}
      />,
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/filme/7')
    expect(screen.getByText('Duna')).toBeInTheDocument()
    expect(screen.getByText('Assinatura')).toBeInTheDocument()
    expect(screen.getByText('★ 8,1')).toBeInTheDocument()
  })

  it('has no badge without kinds', () => {
    render(<PosterCard movie={card({ kinds: undefined })} />)
    expect(screen.queryByText('Assinatura')).toBeNull()
  })

  it('has no star without rating', () => {
    render(<PosterCard movie={card({ rating: '' })} />)
    expect(screen.queryByText(/★/)).toBeNull()
  })
})
