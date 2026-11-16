import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Hero } from '@/components/Hero'
import { HeroCarousel } from '@/components/HeroCarousel'
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
  it('renders rank, rating, year and providers, tolerates empty overview', () => {
    render(
      <Hero
        rank={3}
        movie={card({ title: 'Duna', overview: '', rating: '8,1', year: '2021', providerNames: ['Netflix', 'Max'] })}
      />,
    )
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.getByText('em alta na semana')).toBeInTheDocument()
    expect(screen.getByText('★ 8,1')).toBeInTheDocument()
    expect(screen.getByText('2021')).toBeInTheDocument()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.getByText('Max')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver detalhes/ })).toHaveAttribute('href', '/filme/1')
    expect(screen.queryByText('undefined')).toBeNull()
  })

  it('unrated shows "Sem nota" without the star', () => {
    render(<Hero movie={card({ rating: 'Sem nota', year: '2021' })} />)
    expect(screen.getByText('Sem nota')).toBeInTheDocument()
    expect(screen.queryByText(/★/)).toBeNull()
  })

  it('truncates long overview and renders favoriteSlot', () => {
    render(<Hero movie={card({ overview: 'a'.repeat(400) })} favoriteSlot={<button>Fav</button>} />)
    expect(screen.getByText(/^a+…$/).textContent!.length).toBeLessThanOrEqual(201)
    expect(screen.getByText('Fav')).toBeInTheDocument()
  })
})

describe('HeroCarousel', () => {
  const slides = [
    { key: 1, title: 'Duna', node: <button>Duna</button> },
    { key: 2, title: 'Oppenheimer', node: <button>Oppenheimer</button> },
  ]

  it('mostra só o primeiro slide como ativo e troca pelo indicador', () => {
    render(<HeroCarousel slides={slides} />)
    expect(screen.getByRole('button', { name: 'Duna' })).toBeInTheDocument()
    // slide inativo fica fora da árvore de acessibilidade
    expect(screen.queryByRole('button', { name: 'Oppenheimer' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar destaque 2: Oppenheimer' }))
    expect(screen.getByRole('button', { name: 'Oppenheimer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duna' })).toBeNull()
  })

  it('avança sozinho quando a barra de progresso termina', () => {
    const { container } = render(<HeroCarousel slides={slides} />)
    const bar = container.querySelector('.hero-progress')!
    // jsdom não tem AnimationEvent, então o React escuta a variante webkit
    act(() => {
      for (const type of ['animationend', 'webkitAnimationEnd']) {
        bar.dispatchEvent(new Event(type, { bubbles: true }))
      }
    })
    expect(screen.getByRole('button', { name: 'Oppenheimer' })).toBeInTheDocument()
  })

  function barState(container: HTMLElement) {
    return (container.querySelector('.hero-progress') as HTMLElement).style.animationPlayState
  }

  it('passar o mouse sobre o destaque não pausa o autoplay', () => {
    const { container } = render(<HeroCarousel slides={slides} />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Duna' }))
    fireEvent.mouseOver(screen.getByRole('button', { name: 'Duna' }))
    expect(barState(container)).toBe('running')
  })

  it('pausa com o mouse sobre os indicadores e retoma ao sair', () => {
    const { container } = render(<HeroCarousel slides={slides} />)
    const dots = screen.getByRole('button', { name: /Mostrar destaque 1/ }).parentElement!
    fireEvent.mouseEnter(dots)
    expect(barState(container)).toBe('paused')
    fireEvent.mouseLeave(dots)
    expect(barState(container)).toBe('running')
  })

  it('foco por clique não deixa o carrossel pausado; foco por teclado pausa', () => {
    const { container } = render(<HeroCarousel slides={slides} />)
    const dot = screen.getByRole('button', { name: /Mostrar destaque 2/ })
    const matches = dot.matches.bind(dot)
    const focusVisible = (v: boolean) =>
      (dot.matches = (sel: string) => (sel === ':focus-visible' ? v : matches(sel)))

    focusVisible(false)
    fireEvent.focus(dot)
    expect(barState(container)).toBe('running')

    focusVisible(true)
    fireEvent.focus(dot)
    expect(barState(container)).toBe('paused')
  })

  it('sem indicadores quando há um único destaque', () => {
    render(<HeroCarousel slides={slides.slice(0, 1)} />)
    expect(screen.queryByRole('button', { name: /Mostrar destaque/ })).toBeNull()
  })
})
