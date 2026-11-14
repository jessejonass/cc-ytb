import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Erro from '@/app/error'
import PaginaNaoEncontrada from '@/app/not-found'

describe('páginas de erro', () => {
  it('error.tsx mostra a mensagem, tenta de novo e linka a Vitrine', () => {
    const reset = vi.fn()
    render(<Erro error={new Error('x')} reset={reset} />)
    expect(screen.getByText('Algo deu errado ao carregar os filmes.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(reset).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Voltar para a Vitrine' })).toHaveAttribute('href', '/')
  })

  it('not-found.tsx mostra Página não encontrada com link para a Vitrine', () => {
    render(<PaginaNaoEncontrada />)
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a Vitrine' })).toHaveAttribute('href', '/')
  })
})
