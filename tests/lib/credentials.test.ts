import { describe, expect, it } from 'vitest'
import { parseCredentials } from '@/lib/credentials'

function fd(fields: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}

describe('parseCredentials', () => {
  it('normaliza e-mail', () => {
    expect(parseCredentials(fd({ email: ' Ana@X.com ', password: '12345678' }), 'criar')).toEqual({
      ok: true,
      email: 'ana@x.com',
      password: '12345678',
    })
  })

  it('rejeita e-mail inválido', () => {
    for (const email of ['', 'ana', 'ana@', '@x.com', 'a b@x.com']) {
      expect(parseCredentials(fd({ email, password: '12345678' }), 'entrar')).toEqual({
        ok: false,
        error: 'Informe um e-mail válido.',
      })
    }
  })

  it('rejeita campos ausentes', () => {
    expect(parseCredentials(new FormData(), 'entrar')).toEqual({ ok: false, error: 'Informe um e-mail válido.' })
  })

  it('cadastro exige 8 caracteres', () => {
    expect(parseCredentials(fd({ email: 'a@x.com', password: '1234567' }), 'criar')).toEqual({
      ok: false,
      error: 'A senha precisa ter pelo menos 8 caracteres.',
    })
  })

  it('login aceita senha curta mas não vazia', () => {
    expect(parseCredentials(fd({ email: 'a@x.com', password: '123' }), 'entrar').ok).toBe(true)
    expect(parseCredentials(fd({ email: 'a@x.com', password: '' }), 'entrar')).toEqual({
      ok: false,
      error: 'Informe sua senha.',
    })
  })

  it('não apara a senha', () => {
    const r = parseCredentials(fd({ email: 'a@x.com', password: ' 1234567 ' }), 'criar')
    expect(r).toEqual({ ok: true, email: 'a@x.com', password: ' 1234567 ' })
  })
})
