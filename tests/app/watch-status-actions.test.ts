import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WatchStatus } from '@/lib/watch-status-input'

const sb = vi.hoisted(() => {
  const state = {
    configured: true,
    user: { id: 'u1' } as { id: string } | null,
    result: { error: null } as { error: unknown },
    calls: [] as { op: string; args: unknown[] }[],
  }
  // cadeia "thenable": cada método registra a chamada e devolve a própria cadeia
  const chain: Record<string, unknown> = {}
  for (const op of ['upsert', 'delete', 'eq']) {
    chain[op] = (...args: unknown[]) => {
      state.calls.push({ op, args })
      return chain
    }
  }
  chain.then = (resolve: (v: unknown) => void) => resolve(state.result)
  const from = vi.fn((table: string) => {
    state.calls.push({ op: 'from', args: [table] })
    return chain
  })
  return { state, from }
})

vi.mock('@/lib/supabase/server', () => ({
  isSupabaseConfigured: () => sb.state.configured,
  createServerSupabase: async () => ({
    auth: { getUser: async () => ({ data: { user: sb.state.user } }) },
    from: sb.from,
  }),
}))
const revalidatePath = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidatePath }))

import { clearWatchStatus, setWatchStatus } from '@/app/actions/watch-status'

const m550 = { movieId: 550, title: 'Clube da Luta', posterPath: '/p.jpg', releaseYear: '1999' }

describe('watch-status actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sb.state.configured = true
    sb.state.user = { id: 'u1' }
    sb.state.result = { error: null }
    sb.state.calls = []
  })

  it('sem usuário: unauthenticated', async () => {
    sb.state.user = null
    expect(await setWatchStatus(m550, 'quero')).toEqual({ ok: false, error: 'unauthenticated' })
    expect(await clearWatchStatus(550)).toEqual({ ok: false, error: 'unauthenticated' })
    expect(sb.from).not.toHaveBeenCalled()
  })

  it('Supabase não configurado: unauthenticated', async () => {
    sb.state.configured = false
    expect(await setWatchStatus(m550, 'quero')).toEqual({ ok: false, error: 'unauthenticated' })
  })

  it('status ou filme inválidos: failed sem tocar no banco', async () => {
    expect(await setWatchStatus(m550, 'xyz' as WatchStatus)).toEqual({ ok: false, error: 'failed' })
    expect(await setWatchStatus({ ...m550, movieId: 0 }, 'quero')).toEqual({ ok: false, error: 'failed' })
    expect(await clearWatchStatus(-1)).toEqual({ ok: false, error: 'failed' })
    expect(await clearWatchStatus(1.5)).toEqual({ ok: false, error: 'failed' })
    expect(sb.from).not.toHaveBeenCalled()
  })

  it('setWatchStatus faz upsert e revalida as listas', async () => {
    expect(await setWatchStatus(m550, 'assistido')).toEqual({ ok: true })
    expect(sb.from).toHaveBeenCalledWith('watch_status')
    const upsert = sb.state.calls.find((c) => c.op === 'upsert')!
    expect(upsert.args[0]).toEqual({
      user_id: 'u1',
      movie_id: 550,
      status: 'assistido',
      title: 'Clube da Luta',
      poster_path: '/p.jpg',
      release_year: '1999',
      updated_at: expect.any(String),
    })
    expect(upsert.args[1]).toEqual({ onConflict: 'user_id,movie_id' })
    expect(revalidatePath).toHaveBeenCalledWith('/quero-assistir')
    expect(revalidatePath).toHaveBeenCalledWith('/assistidos')
  })

  it('clearWatchStatus apaga só a linha do usuário', async () => {
    expect(await clearWatchStatus(550)).toEqual({ ok: true })
    expect(sb.state.calls.map((c) => c.op)).toEqual(['from', 'delete', 'eq', 'eq'])
    expect(sb.state.calls.filter((c) => c.op === 'eq').map((c) => c.args)).toEqual([
      ['user_id', 'u1'],
      ['movie_id', 550],
    ])
  })

  it('erro do Supabase: failed', async () => {
    sb.state.result = { error: { message: 'x' } }
    expect(await setWatchStatus(m550, 'quero')).toEqual({ ok: false, error: 'failed' })
    expect(await clearWatchStatus(550)).toEqual({ ok: false, error: 'failed' })
  })
})
