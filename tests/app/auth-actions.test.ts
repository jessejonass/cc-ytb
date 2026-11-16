import { beforeEach, describe, expect, it, vi } from 'vitest'

const sb = vi.hoisted(() => ({
  configured: true,
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({
  isSupabaseConfigured: () => sb.configured,
  createServerSupabase: async () => ({
    auth: { signInWithPassword: sb.signInWithPassword, signUp: sb.signUp, signOut: sb.signOut },
  }),
}))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error('REDIRECT:' + url)
  },
}))

import { signInWithEmail, signUpWithEmail } from '@/app/actions/auth'

function fd(fields: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}

const empty = { error: null }

describe('signInWithEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sb.configured = true
  })

  it('login ok redireciona para next seguro', async () => {
    sb.signInWithPassword.mockResolvedValue({ error: null })
    await expect(
      signInWithEmail(empty, fd({ email: 'A@x.com', password: 'x', next: '/filme/1' })),
    ).rejects.toThrow('REDIRECT:/filme/1')
    expect(sb.signInWithPassword).toHaveBeenCalledWith({ email: 'a@x.com', password: 'x' })
  })

  it('next malicioso vai para /', async () => {
    sb.signInWithPassword.mockResolvedValue({ error: null })
    await expect(
      signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x', next: '//evil.com' })),
    ).rejects.toThrow(/^REDIRECT:\/$/)
  })

  it('login inválido', async () => {
    sb.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    expect(await signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x' }))).toEqual({
      error: 'E-mail ou senha incorretos.',
    })
  })

  it('exceção do Supabase vira erro de login', async () => {
    sb.signInWithPassword.mockRejectedValue(new Error('rede'))
    expect(await signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x' }))).toEqual({
      error: 'E-mail ou senha incorretos.',
    })
  })

  it('Supabase não configurado', async () => {
    sb.configured = false
    expect(await signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x' }))).toEqual({
      error: 'Login indisponível: configure o Supabase.',
    })
  })
})

describe('signUpWithEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sb.configured = true
  })

  it('cadastro com e-mail existente', async () => {
    sb.signUp.mockResolvedValue({ data: {}, error: { code: 'user_already_exists' } })
    expect(await signUpWithEmail(empty, fd({ email: 'a@x.com', password: '12345678' }))).toEqual({
      error: 'Este e-mail já tem conta.',
    })
  })

  it('outro erro no cadastro', async () => {
    sb.signUp.mockResolvedValue({ data: {}, error: { code: 'unexpected_failure' } })
    expect(await signUpWithEmail(empty, fd({ email: 'a@x.com', password: '12345678' }))).toEqual({
      error: 'Não foi possível criar a conta. Tente de novo.',
    })
  })

  it('cadastro ok redireciona', async () => {
    sb.signUp.mockResolvedValue({ data: { session: {} }, error: null })
    await expect(
      signUpWithEmail(empty, fd({ email: 'a@x.com', password: '12345678', next: '/' })),
    ).rejects.toThrow(/^REDIRECT:\/$/)
    expect(sb.signUp).toHaveBeenCalledWith({ email: 'a@x.com', password: '12345678' })
  })

  it('validação falha não chama o Supabase', async () => {
    expect(await signUpWithEmail(empty, fd({ email: 'a@x.com', password: '1' }))).toEqual({
      error: 'A senha precisa ter pelo menos 8 caracteres.',
    })
    expect(sb.signUp).not.toHaveBeenCalled()
  })
})
