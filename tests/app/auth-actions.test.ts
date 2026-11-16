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

const empty = { error: null, email: '' }
const NEEDS_CONFIRM =
  'Sua conta precisa de confirmação por e-mail. Desligue "Confirm email" no Supabase (Authentication → Sign In / Providers → Email).'
const err = (error: string) => ({ error, email: 'a@x.com' })

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

  it('credenciais inválidas', async () => {
    sb.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    expect(await signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x' }))).toEqual(
      err('E-mail ou senha incorretos.'),
    )
  })

  it('e-mail não confirmado tem mensagem própria', async () => {
    sb.signInWithPassword.mockResolvedValue({ error: { code: 'email_not_confirmed' } })
    expect(await signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x' }))).toEqual(err(NEEDS_CONFIRM))
  })

  it('outros erros (ex.: limite de tentativas) não dizem que a senha está errada', async () => {
    sb.signInWithPassword.mockResolvedValue({ error: { code: 'over_request_rate_limit' } })
    expect(await signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x' }))).toEqual(
      err('Não foi possível entrar. Tente de novo.'),
    )
  })

  it('exceção do Supabase vira erro genérico', async () => {
    sb.signInWithPassword.mockRejectedValue(new Error('rede'))
    expect(await signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x' }))).toEqual(
      err('Não foi possível entrar. Tente de novo.'),
    )
  })

  it('devolve o e-mail digitado (normalizado) para o formulário não apagá-lo', async () => {
    sb.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
    expect((await signInWithEmail(empty, fd({ email: ' A@X.com ', password: 'x' }))).email).toBe('a@x.com')
    expect((await signInWithEmail(empty, fd({ email: 'ana', password: 'x' }))).email).toBe('ana')
  })

  it('Supabase não configurado', async () => {
    sb.configured = false
    expect(await signInWithEmail(empty, fd({ email: 'a@x.com', password: 'x' }))).toEqual(
      err('Login indisponível: configure o Supabase.'),
    )
  })
})

describe('signUpWithEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sb.configured = true
  })

  it('cadastro com e-mail existente', async () => {
    sb.signUp.mockResolvedValue({ data: {}, error: { code: 'user_already_exists' } })
    expect(await signUpWithEmail(empty, fd({ email: 'a@x.com', password: '12345678' }))).toEqual(
      err('Este e-mail já tem conta.'),
    )
  })

  it('outro erro no cadastro', async () => {
    sb.signUp.mockResolvedValue({ data: {}, error: { code: 'unexpected_failure' } })
    expect(await signUpWithEmail(empty, fd({ email: 'a@x.com', password: '12345678' }))).toEqual(
      err('Não foi possível criar a conta. Tente de novo.'),
    )
  })

  it('cadastro sem sessão (confirmação ligada) avisa em vez de fingir sucesso', async () => {
    sb.signUp.mockResolvedValue({ data: { user: {}, session: null }, error: null })
    expect(
      await signUpWithEmail(empty, fd({ email: 'a@x.com', password: '12345678', next: '/' })),
    ).toEqual(err(NEEDS_CONFIRM))
  })

  it('cadastro ok redireciona', async () => {
    sb.signUp.mockResolvedValue({ data: { session: {} }, error: null })
    await expect(
      signUpWithEmail(empty, fd({ email: 'a@x.com', password: '12345678', next: '/' })),
    ).rejects.toThrow(/^REDIRECT:\/$/)
    expect(sb.signUp).toHaveBeenCalledWith({ email: 'a@x.com', password: '12345678' })
  })

  it('validação falha não chama o Supabase', async () => {
    expect(await signUpWithEmail(empty, fd({ email: 'a@x.com', password: '1' }))).toEqual(
      err('A senha precisa ter pelo menos 8 caracteres.'),
    )
    expect(sb.signUp).not.toHaveBeenCalled()
  })
})
