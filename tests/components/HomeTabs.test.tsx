import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { HomeTabs } from '@/components/HomeTabs'
import { isHomeTabPath } from '@/lib/home-tabs'

describe('HomeTabs', () => {
  it('tem as três abas com a ativa marcada', () => {
    render(<HomeTabs active="quero" />)
    const nav = screen.getByRole('navigation', { name: 'Abas da inicial' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Início', '/'],
      ['Quero assistir', '/quero-assistir'],
      ['Já assistidos', '/assistidos'],
    ])
    expect(within(nav).getByRole('link', { name: 'Quero assistir' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
    expect(within(nav).getByRole('link', { name: 'Já assistidos' })).not.toHaveAttribute('aria-current')
  })
})

describe('isHomeTabPath', () => {
  it('reconhece as rotas das abas', () => {
    for (const p of ['/', '/quero-assistir', '/assistidos']) expect(isHomeTabPath(p)).toBe(true)
    for (const p of ['/catalogo', '/assistidos-x', '/favoritos', null]) expect(isHomeTabPath(p)).toBe(false)
  })
})
