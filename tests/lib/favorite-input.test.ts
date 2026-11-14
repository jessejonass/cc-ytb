import { describe, expect, it } from 'vitest'
import { validateFavoriteInput } from '@/lib/favorite-input'

const ok = { movieId: 550, title: 'Clube da Luta', posterPath: '/abc_D-1.jpg', releaseYear: '1999' }

describe('validateFavoriteInput', () => {
  it('aceita entrada válida e apara o título', () => {
    expect(validateFavoriteInput({ ...ok, title: '  Clube da Luta  ' })).toEqual(ok)
  })

  it('aceita pôster e ano nulos', () => {
    expect(validateFavoriteInput({ ...ok, posterPath: null, releaseYear: null })).toEqual({
      ...ok,
      posterPath: null,
      releaseYear: null,
    })
  })

  it('aceita as extensões de imagem permitidas', () => {
    for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
      expect(validateFavoriteInput({ ...ok, posterPath: `/x.${ext}` })).not.toBeNull()
    }
  })

  it('movieId precisa ser inteiro positivo até 2147483647', () => {
    expect(validateFavoriteInput({ ...ok, movieId: 2147483647 })).not.toBeNull()
    for (const movieId of [0, -1, 1.5, 2147483648, NaN, '550']) {
      expect(validateFavoriteInput({ ...ok, movieId })).toBeNull()
    }
  })

  it('título precisa ter de 1 a 300 caracteres depois de aparado', () => {
    expect(validateFavoriteInput({ ...ok, title: 'a'.repeat(300) })).not.toBeNull()
    expect(validateFavoriteInput({ ...ok, title: 'a'.repeat(301) })).toBeNull()
    expect(validateFavoriteInput({ ...ok, title: '   ' })).toBeNull()
    expect(validateFavoriteInput({ ...ok, title: 42 })).toBeNull()
  })

  it('posterPath precisa ser nulo ou um caminho de imagem do TMDB', () => {
    for (const posterPath of ['p.jpg', '/a/b.jpg', '/x.gif', '/x.jpg?y=1', '/../x.jpg', '', 5, undefined]) {
      expect(validateFavoriteInput({ ...ok, posterPath })).toBeNull()
    }
  })

  it('releaseYear precisa ser nulo ou 4 dígitos', () => {
    for (const releaseYear of ['99', '19999', 'abcd', '1999 ', 1999, undefined]) {
      expect(validateFavoriteInput({ ...ok, releaseYear })).toBeNull()
    }
  })

  it('rejeita entradas que não são objeto', () => {
    expect(validateFavoriteInput(null)).toBeNull()
    expect(validateFavoriteInput('x')).toBeNull()
  })
})
