'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { addFavorite, removeFavorite, type FavoriteMovie } from '@/app/actions/favorites'

export function FavoriteButton({
  movie,
  initialFavorited,
  isLoggedIn,
}: {
  movie: FavoriteMovie
  initialFavorited: boolean
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [favorited, setFavorited] = useState(initialFavorited)
  const [error, setError] = useState(false)
  const pendingHandled = useRef(false)

  useEffect(() => {
    if (pendingHandled.current) return
    pendingHandled.current = true
    if (!isLoggedIn || initialFavorited) return
    if (searchParams.get('fav') !== String(movie.movieId)) return
    setFavorited(true)
    addFavorite(movie).then((r) => {
      if (!r.ok) {
        setFavorited(false)
        setError(true)
      }
    })
    const rest = new URLSearchParams(searchParams.toString())
    rest.delete('fav')
    const qs = rest.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
    // roda uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onClick() {
    if (!isLoggedIn) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('fav', String(movie.movieId))
      router.push(`/entrar?next=${encodeURIComponent(`${pathname}?${params.toString()}`)}`)
      return
    }
    const next = !favorited
    setError(false)
    setFavorited(next)
    try {
      const r = next ? await addFavorite(movie) : await removeFavorite(movie.movieId)
      if (!r.ok) {
        setFavorited(!next)
        setError(true)
      }
    } catch {
      setFavorited(!next)
      setError(true)
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        aria-pressed={favorited}
        onClick={onClick}
        className={`rounded-md border px-4 py-2 text-sm font-semibold ${
          favorited
            ? 'border-accent bg-accent text-bg'
            : 'border-muted hover:border-accent hover:text-accent'
        }`}
      >
        {favorited ? '♥ Favoritado' : '♡ Favoritar'}
      </button>
      {error && (
        <p role="alert" className="text-xs text-muted">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </div>
  )
}
