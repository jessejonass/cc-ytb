import { afterEach, describe, expect, it, vi } from 'vitest'
import { supabaseKey } from '@/lib/supabase/env'

describe('supabaseKey', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('usa a chave publishable (nome atual do Supabase)', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    expect(supabaseKey()).toBe('sb_publishable_x')
  })

  it('aceita a chave anon antiga como reserva', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJ-antiga')
    expect(supabaseKey()).toBe('eyJ-antiga')
  })

  it('sem nenhuma das duas devolve undefined', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    expect(supabaseKey()).toBeUndefined()
  })
})
