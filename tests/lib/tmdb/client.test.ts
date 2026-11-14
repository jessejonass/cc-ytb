import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TmdbNotFoundError, imageUrl, tmdbFetch } from '@/lib/tmdb/client'

describe('tmdbFetch', () => {
  const originalToken = process.env.TMDB_READ_TOKEN
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    process.env.TMDB_READ_TOKEN = 't'
    fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalToken === undefined) delete process.env.TMDB_READ_TOKEN
    else process.env.TMDB_READ_TOKEN = originalToken
  })

  it('monta URL, header e cache', async () => {
    await tmdbFetch('/movie/550', { append_to_response: 'credits', page: undefined }, 86400)
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string>; next: { revalidate: number } },
    ]
    expect(url).toBe(
      'https://api.themoviedb.org/3/movie/550?append_to_response=credits&language=pt-BR',
    )
    expect(init.headers.Authorization).toBe('Bearer t')
    expect(init.next).toEqual({ revalidate: 86400 })
  })

  it('lança TmdbNotFoundError em 404', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 404 }))
    await expect(tmdbFetch('/movie/1', {}, 60)).rejects.toBeInstanceOf(TmdbNotFoundError)
  })

  it('lança Error com o status em 500', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
    await expect(tmdbFetch('/x', {}, 60)).rejects.toThrow('500')
  })

  it('lança sem token', async () => {
    delete process.env.TMDB_READ_TOKEN
    await expect(tmdbFetch('/x', {}, 60)).rejects.toThrow('TMDB_READ_TOKEN não configurado')
  })
})

describe('imageUrl', () => {
  it('monta a URL da imagem', () => {
    expect(imageUrl('/a.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/a.jpg')
  })
  it('retorna null sem caminho', () => {
    expect(imageUrl(null, 'w342')).toBeNull()
    expect(imageUrl('/a.jpg', 'w92')).toBe('https://image.tmdb.org/t/p/w92/a.jpg')
  })
})
