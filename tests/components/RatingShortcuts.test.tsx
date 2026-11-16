import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RatingShortcuts } from '@/components/RatingShortcuts'

describe('RatingShortcuts', () => {
  it('leva ao catálogo filtrado e ordenado por nota', () => {
    render(<RatingShortcuts />)
    expect(screen.getByRole('link', { name: 'Filmes com nota 7 ou mais' })).toHaveAttribute(
      'href',
      '/catalogo?nota=7&ordem=nota',
    )
    expect(screen.getByRole('link', { name: 'Filmes com nota 8 ou mais' })).toHaveAttribute(
      'href',
      '/catalogo?nota=8&ordem=nota',
    )
    expect(screen.getByText('7+')).toBeInTheDocument()
    expect(screen.getByText('8+')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })
})
