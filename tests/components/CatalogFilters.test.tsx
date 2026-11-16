import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CatalogFilters } from '@/components/CatalogFilters'
import type { CatalogFilters as Filters } from '@/lib/tmdb/catalog'

const push = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const base: Filters = {
  providers: [],
  genres: [],
  from: null,
  to: null,
  minRating: null,
  sort: 'popularidade',
  page: 1,
}

function renderPanel(filters: Filters) {
  render(<CatalogFilters filters={filters} featured={[]} others={[]} genres={[]} />)
}

describe('CatalogFilters — nota mínima', () => {
  beforeEach(() => push.mockClear())

  it('mostra a seção Nota mínima com 6+, 7+ e 8+', () => {
    renderPanel(base)
    expect(screen.getByRole('heading', { name: 'Nota mínima' })).toBeInTheDocument()
    for (const l of ['6+', '7+', '8+']) {
      expect(screen.getByRole('button', { name: l })).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('escolher nota volta para a página 1', () => {
    renderPanel({ ...base, page: 4 })
    fireEvent.click(screen.getByRole('button', { name: '7+' }))
    expect(push).toHaveBeenCalledWith('/catalogo?nota=7')
  })

  it('clicar no chip ativo limpa a nota', () => {
    renderPanel({ ...base, minRating: 8 })
    const chip = screen.getByRole('button', { name: '8+' })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(chip)
    expect(push).toHaveBeenCalledWith('/catalogo')
  })
})
