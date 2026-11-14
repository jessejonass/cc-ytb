import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const sb = vi.hoisted(() => ({
  configured: true,
  exchange: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({
  isSupabaseConfigured: () => sb.configured,
  createServerSupabase: async () => ({ auth: { exchangeCodeForSession: sb.exchange } }),
}))

import { GET } from '@/app/auth/callback/route'

const call = (qs: string) => GET(new NextRequest(`http://localhost:3000/auth/callback${qs}`))

describe('GET /auth/callback', () => {
  beforeEach(() => {
    sb.configured = true
    sb.exchange.mockReset()
  })

  it('sucesso redireciona para o next seguro', async () => {
    sb.exchange.mockResolvedValue({ error: null })
    const r = await call('?code=c&next=%2Ffilme%2F550%3Ffav%3D550')
    expect(r.headers.get('location')).toBe('http://localhost:3000/filme/550?fav=550')
  })

  it('falha volta para /entrar com erro e preserva o next', async () => {
    sb.exchange.mockResolvedValue({ error: new Error('x') })
    const r = await call('?code=c&next=%2Ffilme%2F550%3Ffav%3D550')
    expect(r.headers.get('location')).toBe(
      `http://localhost:3000/entrar?erro=1&next=${encodeURIComponent('/filme/550?fav=550')}`,
    )
  })

  it('sem code usa o next sanitizado na volta', async () => {
    const r = await call('?next=https%3A%2F%2Fevil.com')
    expect(r.headers.get('location')).toBe('http://localhost:3000/entrar?erro=1&next=%2F')
  })
})
