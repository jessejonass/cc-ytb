import { describe, expect, it } from 'vitest'
import {
  buildCatalogUrl,
  buildDiscoverParams,
  DECADES,
  MIN_RATINGS,
  parseCatalogFilters,
  parsePage,
  type CatalogFilters,
} from '@/lib/tmdb/catalog'

const base: CatalogFilters = {
  providers: [],
  genres: [],
  from: null,
  to: null,
  minRating: null,
  sort: 'popularidade',
  page: 1,
}

describe('parsePage', () => {
  it('normaliza páginas', () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage('7')).toBe(7)
    expect(parsePage('0')).toBe(1)
    expect(parsePage('600')).toBe(500)
    expect(parsePage('x')).toBe(1)
    expect(parsePage(['3', '4'])).toBe(3)
  })
})

describe('parseCatalogFilters', () => {
  it('usa padrões', () => {
    expect(parseCatalogFilters({})).toEqual(base)
  })
  it('descarta valores inválidos', () => {
    expect(
      parseCatalogFilters({ servicos: '8,abc,119', generos: 'x', de: '3000', ate: '1989', nota: '9', ordem: 'xyz', pagina: '9999' }),
    ).toEqual({ providers: [8, 119], genres: [], from: null, to: 1989, minRating: null, sort: 'popularidade', page: 500 })
  })
  it('limita página', () => {
    expect(parseCatalogFilters({ pagina: '0' }).page).toBe(1)
    expect(parseCatalogFilters({ pagina: ['3', '4'] }).page).toBe(3)
    expect(parseCatalogFilters({ pagina: 'abc' }).page).toBe(1)
  })
  it('lê nota mínima válida', () => {
    expect(parseCatalogFilters({ nota: '7' }).minRating).toBe(7)
    expect(parseCatalogFilters({ nota: ['8', '6'] }).minRating).toBe(8)
  })
  it('descarta notas inválidas', () => {
    for (const nota of ['7.5', '10', '9', '0', 'abc', '', '-7', '07']) {
      expect(parseCatalogFilters({ nota }).minRating).toBeNull()
    }
  })
})

describe('buildDiscoverParams', () => {
  it('monta parâmetros completos', () => {
    const p = buildDiscoverParams(
      { providers: [], genres: [27, 53], from: 1980, to: 1989, minRating: null, sort: 'nota', page: 2 },
      [8, 119],
    )
    expect(p).toEqual({
      watch_region: 'BR',
      with_watch_providers: '8|119',
      with_genres: '27|53',
      'primary_release_date.gte': '1980-01-01',
      'primary_release_date.lte': '1989-12-31',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100,
      page: 2,
    })
  })
  it('usa serviços escolhidos', () => {
    expect(buildDiscoverParams({ ...base, providers: [337] }, [8]).with_watch_providers).toBe('337')
  })
  it('omite gêneros e datas vazios', () => {
    const p = buildDiscoverParams(base, [8])
    expect(p).not.toHaveProperty('with_genres')
    expect(p).not.toHaveProperty('primary_release_date.gte')
    expect(p.sort_by).toBe('popularity.desc')
  })
  it('filtra por nota mínima com piso de votos', () => {
    const p = buildDiscoverParams({ ...base, minRating: 8 }, [8])
    expect(p['vote_average.gte']).toBe(8)
    expect(p['vote_count.gte']).toBe(100)
    expect(p.sort_by).toBe('popularity.desc')
  })
  it('nota com ordem por nota', () => {
    const p = buildDiscoverParams({ ...base, minRating: 7, sort: 'nota' }, [8])
    expect(p['vote_average.gte']).toBe(7)
    expect(p['vote_count.gte']).toBe(100)
    expect(p.sort_by).toBe('vote_average.desc')
  })
  it('sem nota mínima não envia vote_average.gte nem piso de votos', () => {
    const p = buildDiscoverParams(base, [8])
    expect(p).not.toHaveProperty(['vote_average.gte'])
    expect(p).not.toHaveProperty(['vote_count.gte'])
  })
})

describe('buildCatalogUrl', () => {
  it('serializa só o que difere do padrão', () => {
    expect(buildCatalogUrl(base)).toBe('/catalogo')
    expect(
      buildCatalogUrl({ providers: [8], genres: [27], from: 1980, to: 1989, minRating: 8, sort: 'nota', page: 2 }),
    ).toBe('/catalogo?servicos=8&generos=27&de=1980&ate=1989&nota=8&ordem=nota&pagina=2')
  })
  it('serializa nota', () => {
    expect(buildCatalogUrl({ ...base, minRating: 7, sort: 'nota' })).toBe('/catalogo?nota=7&ordem=nota')
  })
})

describe('DECADES', () => {
  it('cada atalho sobrevive ao ciclo URL -> parse', () => {
    for (const d of DECADES) {
      const url = buildCatalogUrl({ ...base, from: d.from, to: d.to })
      const sp = Object.fromEntries(new URL(url, 'http://x').searchParams)
      const parsed = parseCatalogFilters(sp)
      expect(parsed.from).toBe(d.from)
      expect(parsed.to).toBe(d.to)
    }
  })
})

describe('MIN_RATINGS', () => {
  it('cada nota sobrevive ao ciclo URL -> parse', () => {
    expect(MIN_RATINGS).toEqual([6, 7, 8])
    for (const r of MIN_RATINGS) {
      const url = buildCatalogUrl({ ...base, minRating: r })
      const sp = Object.fromEntries(new URL(url, 'http://x').searchParams)
      expect(parseCatalogFilters(sp).minRating).toBe(r)
    }
  })
})
