import { describe, expect, it } from 'vitest'
import { formatRating, formatRuntime, releaseYear } from '@/lib/format'

describe('formatRating', () => {
  it('formata com uma casa e vírgula', () => {
    expect(formatRating(8.06, 1200)).toBe('8,1')
    expect(formatRating(7, 50)).toBe('7,0')
  })
  it('sem votos retorna "Sem nota"', () => {
    expect(formatRating(0, 0)).toBe('Sem nota')
  })
})

describe('formatRuntime', () => {
  it('formata horas e minutos', () => {
    expect(formatRuntime(125)).toBe('2h 05min')
    expect(formatRuntime(45)).toBe('45min')
  })
  it('retorna null para vazio', () => {
    expect(formatRuntime(null)).toBeNull()
    expect(formatRuntime(0)).toBeNull()
  })
})

describe('releaseYear', () => {
  it('extrai o ano', () => {
    expect(releaseYear('2025-03-14')).toBe('2025')
  })
  it('retorna null para vazio', () => {
    expect(releaseYear('')).toBeNull()
    expect(releaseYear(undefined)).toBeNull()
    expect(releaseYear(null)).toBeNull()
  })
})
