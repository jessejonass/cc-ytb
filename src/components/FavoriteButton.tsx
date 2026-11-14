'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { addFavorite, removeFavorite } from '@/app/actions/favorites'
import type { FavoriteMovie } from '@/lib/favorite-input'

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
  const [favorited, setFavorited] = useState(initialFavorited)
  const [error, setError] = useState(false)
  const pendingHandled = useRef(false)

  useEffect(() => {
    if (pendingHandled.current) return
    pendingHandled.current = true
    if (!isLoggedIn || initialFavorited) return
    // lido do window (e não de useSearchParams) para não exigir Suspense no build
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('fav') !== String(movie.movieId)) return
    setFavorited(true)
    const revert = () => {
      setFavorited(false)
      setError(true)
    }
    addFavorite(movie).then((r) => {
      if (!r.ok) revert()
    }, revert)
    const rest = new URLSearchParams(searchParams)
    rest.delete('fav')
    const qs = rest.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
    // roda uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onClick() {
    if (!isLoggedIn) {
      const params = new URLSearchParams(window.location.search)
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
