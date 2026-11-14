export type FavoriteMovie = {
  movieId: number
  title: string
  posterPath: string | null
  releaseYear: string | null
}

const MAX_INT4 = 2147483647
const MAX_TITLE = 300
const POSTER_RE = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/
const YEAR_RE = /^\d{4}$/

/** Valida e normaliza a entrada de addFavorite (vinda do cliente, não confiável). */
export function validateFavoriteInput(input: unknown): FavoriteMovie | null {
  if (!input || typeof input !== 'object') return null
  const m = input as Record<string, unknown>
  const { movieId, title, posterPath, releaseYear } = m
  if (typeof movieId !== 'number' || !Number.isInteger(movieId) || movieId <= 0 || movieId > MAX_INT4) {
    return null
  }
  if (typeof title !== 'string') return null
  const trimmed = title.trim()
  if (trimmed.length < 1 || trimmed.length > MAX_TITLE) return null
  if (posterPath !== null && (typeof posterPath !== 'string' || !POSTER_RE.test(posterPath))) {
    return null
  }
  if (releaseYear !== null && (typeof releaseYear !== 'string' || !YEAR_RE.test(releaseYear))) {
    return null
  }
  return { movieId, title: trimmed, posterPath, releaseYear }
}
