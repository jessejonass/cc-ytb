import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const actions = vi.hoisted(() => ({ signInWithEmail: vi.fn(), signUpWithEmail: vi.fn() }))
vi.mock('@/app/actions/auth', () => actions)

import { EmailAuthForm } from '@/components/EmailAuthForm'

describe('EmailAuthForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('começa no modo Entrar', () => {
    const { container } = render(<EmailAuthForm next="/filme/1" />)
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute('type', 'submit')
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email')
    const senha = screen.getByLabelText('Senha')
    expect(senha).toHaveAttribute('type', 'password')
    expect(senha).toHaveAttribute('autocomplete', 'current-password')
    expect(senha).not.toHaveAttribute('minlength')
    expect(container.querySelector('input[type="hidden"][name="next"]')).toHaveValue('/filme/1')
  })

  it('alterna para Criar conta', () => {
    render(<EmailAuthForm next="/" />)
    expect(screen.getByRole('tab', { name: 'Entrar' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Criar conta' }))
    expect(screen.getByRole('tab', { name: 'Criar conta' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Criar conta' })).toHaveAttribute('type', 'submit')
    const senha = screen.getByLabelText('Senha')
    expect(senha).toHaveAccessibleDescription('Mínimo de 8 caracteres.')
    expect(senha).toHaveAttribute('minlength', '8')
    expect(senha).toHaveAttribute('autocomplete', 'new-password')
  })

  it('mostra o erro devolvido pela action e mantém o e-mail digitado', async () => {
    actions.signInWithEmail.mockResolvedValue({ error: 'E-mail ou senha incorretos.', email: 'a@x.com' })
    render(<EmailAuthForm next="/" />)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@x.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(screen.getByLabelText('E-mail')).toHaveValue('a@x.com')
  })
})
