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
  it('rejeita caracteres de controle e espaços', () => {
    expect(safeNextPath('/\t/evil.com')).toBe('/')
    expect(safeNextPath('/\n/evil.com')).toBe('/')
    expect(safeNextPath('/ /evil.com')).toBe('/')
  })
  it('mantém %09 literal seguro e na mesma origem', () => {
    const r = safeNextPath('/%09/evil.com')
    expect(r.startsWith('//')).toBe(false)
    expect(new URL(r, 'http://x').origin).toBe('http://x')
  })
  it('rejeita vazio e nulo', () => {
    expect(safeNextPath('')).toBe('/')
    expect(safeNextPath(null)).toBe('/')
    expect(safeNextPath(undefined)).toBe('/')
  })
})
