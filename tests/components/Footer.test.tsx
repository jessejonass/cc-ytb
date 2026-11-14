import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

describe('Footer', () => {
  it('exibe os créditos TMDB e JustWatch', () => {
    render(<Footer />)
    expect(
      screen.getByText(/usa a API do TMDB, mas não é endossado ou certificado pelo TMDB/),
    ).toBeInTheDocument()
    expect(screen.getByText(/JustWatch/)).toBeInTheDocument()
  })
})
