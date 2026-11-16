import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { RatingShortcuts } from '@/components/RatingShortcuts'

describe('RatingShortcuts (barra da inicial)', () => {
  it('é uma navegação "Explorar por nota" com rótulo visível', () => {
    render(<RatingShortcuts />)
    expect(screen.getByRole('navigation', { name: 'Explorar por nota' })).toBeInTheDocument()
    expect(screen.getByText('Explorar por nota')).toBeVisible()
  })

  it('cada chip leva ao catálogo filtrado e ordenado por nota', () => {
    render(<RatingShortcuts />)
    const nav = screen.getByRole('navigation', { name: 'Explorar por nota' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(4)
    for (const r of [6, 7, 8, 9]) {
      expect(within(nav).getByRole('link', { name: new RegExp(`^${r}\\+`) })).toHaveAttribute(
        'href',
        `/catalogo?nota=${r}&ordem=nota`,
      )
    }
  })

  it('o nome acessível começa pelo texto visível e explica o destino', () => {
    render(<RatingShortcuts />)
    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-label')
    }
    expect(screen.getByRole('link', { name: /^8\+.*filmes com nota 8 ou mais/i })).toBeInTheDocument()
  })
})
