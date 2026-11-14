import { describe, it, expect } from 'vitest'
import { safeNextPath } from '@/lib/auth'

describe('safeNextPath', () => {
  it('aceita caminhos internos', () => {
    expect(safeNextPath('/filme/550?fav=550')).toBe('/filme/550?fav=550')
  })
  it('rejeita URLs externas e variantes', () => {
    expect(safeNextPath('https://evil.com')).toBe('/')
    expect(safeNextPath('//evil.com')).toBe('/')
    expect(safeNextPath('/\\evil.com')).toBe('/')
  })
  it('rejeita vazio e nulo', () => {
    expect(safeNextPath('')).toBe('/')
    expect(safeNextPath(null)).toBe('/')
    expect(safeNextPath(undefined)).toBe('/')
  })
})
