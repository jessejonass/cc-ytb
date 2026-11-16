import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RatingShortcuts } from '@/components/RatingShortcuts'

describe('RatingShortcuts', () => {
  it('leva ao catálogo filtrado e ordenado por nota', () => {
    render(<RatingShortcuts />)
    expect(screen.getByRole('link', { name: /filmes com nota 7 ou mais/i })).toHaveAttribute(
      'href',
      '/catalogo?nota=7&ordem=nota',
    )
    expect(screen.getByRole('link', { name: /filmes com nota 8 ou mais/i })).toHaveAttribute(
      'href',
      '/catalogo?nota=8&ordem=nota',
    )
    expect(screen.getByText('7+')).toBeInTheDocument()
    expect(screen.getByText('8+')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('o nome acessível começa pelo texto visível (comando de voz "clique em 7+")', () => {
    render(<RatingShortcuts />)
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-label')
    }
    expect(screen.getByRole('link', { name: /^7\+/ })).toHaveAttribute('href', '/catalogo?nota=7&ordem=nota')
    expect(screen.getByRole('link', { name: /^8\+/ })).toHaveAttribute('href', '/catalogo?nota=8&ordem=nota')
  })
})
