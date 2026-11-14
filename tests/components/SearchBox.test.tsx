import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchBox, { SearchForm } from '@/components/SearchBox'

const nav = vi.hoisted(() => ({ pathname: '/', q: null as string | null }))
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.q ? { q: nav.q } : {}),
}))

describe('SearchBox', () => {
  beforeEach(() => {
    nav.pathname = '/'
    nav.q = null
  })

  it('vem preenchido com q em /busca', () => {
    nav.pathname = '/busca'
    nav.q = 'matrix'
    render(<SearchBox />)
    expect(screen.getByRole('searchbox')).toHaveValue('matrix')
  })

  it('fica vazio fora de /busca', () => {
    nav.q = 'matrix'
    render(<SearchBox />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('SearchForm (fallback do Suspense) renderiza o mesmo formulário vazio', () => {
    const { container: fallback } = render(<SearchForm q="" />)
    const { container: real } = render(<SearchBox />)
    expect(fallback.innerHTML).toBe(real.innerHTML)
    expect(fallback.querySelector('form')).toHaveAttribute('action', '/busca')
    expect(fallback.querySelector('input')).toHaveValue('')
  })
})
