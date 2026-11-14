import { describe, expect, it } from 'vitest'
import { summarizeAvailability } from '@/lib/tmdb/availability'

const p = (id: number, name: string, display_priority: number) => ({
  provider_id: id,
  provider_name: name,
  logo_path: null,
  display_priority,
})

describe('summarizeAvailability', () => {
  it('agrupa na ordem de exibição e ordena por prioridade', () => {
    const a = summarizeAvailability({
      link: 'L',
      rent: [p(2, 'Apple TV', 5)],
      flatrate: [p(8, 'Netflix', 2), p(119, 'Prime Video', 1)],
    })
    expect(a.available).toBe(true)
    expect(a.link).toBe('L')
    expect(a.kinds).toEqual(['flatrate', 'rent'])
    expect(a.groups[0]).toMatchObject({ kind: 'flatrate', label: 'Assinatura' })
    expect(a.groups[0].providers.map((x) => x.name)).toEqual(['Prime Video', 'Netflix'])
  })

  it('indisponível sem região ou com grupos vazios', () => {
    expect(summarizeAvailability(undefined)).toEqual({ available: false, link: null, kinds: [], groups: [] })
    expect(summarizeAvailability({ link: 'L', flatrate: [] }).available).toBe(false)
  })
})
