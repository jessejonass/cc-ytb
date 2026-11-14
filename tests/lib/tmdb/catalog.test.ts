import { describe, expect, it } from 'vitest'
import {
  buildCatalogUrl,
  buildDiscoverParams,
  parseCatalogFilters,
  parsePage,
  type CatalogFilters,
} from '@/lib/tmdb/catalog'

const base: CatalogFilters = {
  providers: [],
  genres: [],
  from: null,
  to: null,
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
      parseCatalogFilters({ servicos: '8,abc,119', generos: 'x', de: '3000', ate: '1989', ordem: 'xyz', pagina: '9999' }),
    ).toEqual({ providers: [8, 119], genres: [], from: null, to: 1989, sort: 'popularidade', page: 500 })
  })
  it('limita página', () => {
    expect(parseCatalogFilters({ pagina: '0' }).page).toBe(1)
    expect(parseCatalogFilters({ pagina: ['3', '4'] }).page).toBe(3)
    expect(parseCatalogFilters({ pagina: 'abc' }).page).toBe(1)
  })
})

describe('buildDiscoverParams', () => {
  it('monta parâmetros completos', () => {
    const p = buildDiscoverParams(
      { providers: [], genres: [27, 53], from: 1980, to: 1989, sort: 'nota', page: 2 },
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
})

describe('buildCatalogUrl', () => {
  it('serializa só o que difere do padrão', () => {
    expect(buildCatalogUrl(base)).toBe('/catalogo')
    expect(
      buildCatalogUrl({ providers: [8], genres: [27], from: 1980, to: 1989, sort: 'nota', page: 2 }),
    ).toBe('/catalogo?servicos=8&generos=27&de=1980&ate=1989&ordem=nota&pagina=2')
  })
})
