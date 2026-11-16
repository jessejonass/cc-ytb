'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clearWatchStatus, setWatchStatus } from '@/app/actions/watch-status'
import type { FavoriteMovie } from '@/lib/favorite-input'
import { isWatchStatus, nextWatchAction, type WatchStatus } from '@/lib/watch-status-input'

const BUTTONS: { status: WatchStatus; label: string; icon: string }[] = [
  { status: 'quero', label: 'Quero assistir', icon: '+' },
  { status: 'assistido', label: 'Já assisti', icon: '✓' },
]

export function WatchStatusButtons({
  movie,
  initialStatus,
  isLoggedIn,
}: {
  movie: FavoriteMovie
  initialStatus: WatchStatus | null
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<WatchStatus | null>(initialStatus)
  const [error, setError] = useState(false)
  const pendingHandled = useRef(false)

  async function apply(clicked: WatchStatus, previous: WatchStatus | null) {
    const action = nextWatchAction(previous, clicked)
    setError(false)
    setStatus(action.kind === 'set' ? action.status : null)
    const revert = () => {
      setStatus(previous)
      setError(true)
    }
    try {
      const r =
        action.kind === 'set'
          ? await setWatchStatus(movie, action.status)
          : await clearWatchStatus(movie.movieId)
      if (!r.ok) revert()
    } catch {
      revert()
    }
  }

  useEffect(() => {
    if (pendingHandled.current) return
    pendingHandled.current = true
    if (!isLoggedIn) return
    // lido do window (e não de useSearchParams) para não exigir Suspense no build
    const params = new URLSearchParams(window.location.search)
    const pending = params.get('lista')
    if (!isWatchStatus(pending)) return
    params.delete('lista')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
    if (initialStatus !== pending) void apply(pending, initialStatus)
    // roda uma vez por montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onClick(clicked: WatchStatus) {
    if (!isLoggedIn) {
      const params = new URLSearchParams(window.location.search)
      params.set('lista', clicked)
      router.push(`/entrar?next=${encodeURIComponent(`${pathname}?${params.toString()}`)}`)
      return
    }
    void apply(clicked, status)
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-3">
        {BUTTONS.map((b) => {
          const active = status === b.status
          return (
            <button
              key={b.status}
              type="button"
              aria-pressed={active}
              onClick={() => onClick(b.status)}
              className={`group inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-[0.95rem] font-semibold transition-[transform,background-color,border-color,color] hover:scale-[1.04] hover:bg-white/15 active:scale-95 ${
                active ? '!border-accent/70 text-accent' : 'text-fg'
              }`}
            >
              <span aria-hidden className="text-lg leading-none">
                {b.icon}
              </span>
              {b.label}
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs text-muted">
          Não foi possível salvar. Tente de novo.
        </p>
      )}
    </div>
  )
}
