import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WhereToWatch } from '@/components/WhereToWatch'
import { summarizeAvailability } from '@/lib/tmdb/availability'

const provider = (id: number, name: string, priority = 1) => ({
  provider_id: id,
  provider_name: name,
  logo_path: `/${id}.jpg`,
  display_priority: priority,
})

describe('WhereToWatch', () => {
  it('mostra grupos, serviços, crédito e link', () => {
    const availability = summarizeAvailability({
      link: 'https://www.themoviedb.org/movie/550/watch?locale=BR',
      flatrate: [provider(8, 'Netflix')],
      rent: [provider(2, 'Apple TV')],
    })
    render(<WhereToWatch availability={availability} />)
    expect(screen.getByText('Assinatura')).toBeInTheDocument()
    expect(screen.getByText('Aluguel')).toBeInTheDocument()
    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.getByText(/Dados de onde assistir: JustWatch/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Ver opções/ })
    expect(link).toHaveAttribute('href', 'https://www.themoviedb.org/movie/550/watch?locale=BR')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('mostra aviso de indisponível com crédito e sem link', () => {
    render(<WhereToWatch availability={{ available: false, link: null, kinds: [], groups: [] }} />)
    expect(
      screen.getByText('Este filme não está disponível em streaming no Brasil no momento.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Dados de onde assistir: JustWatch/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
