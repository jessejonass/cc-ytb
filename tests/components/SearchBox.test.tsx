import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchBox from '@/components/SearchBox'

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
})
