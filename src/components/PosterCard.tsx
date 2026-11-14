import Image from 'next/image'
import Link from 'next/link'
import { AccessBadge } from '@/components/AccessBadge'
import { imageUrl } from '@/lib/tmdb/client'
import type { MovieCard } from '@/lib/tmdb/movies'

export function PosterCard({ movie }: { movie: MovieCard }) {
  const src = imageUrl(movie.posterPath, 'w342')
  const kind = movie.kinds?.[0]
  const meta = [movie.rating ? `★ ${movie.rating}` : null, movie.year].filter(Boolean)
  return (
    <Link
      href={`/filme/${movie.id}`}
      className="group block w-36 shrink-0 snap-start sm:w-40"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-panel">
        {src ? (
          <Image
            src={src}
            alt={movie.title}
            fill
            sizes="160px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-muted">
            {movie.title}
          </div>
        )}
        {kind && (
          <div className="absolute bottom-2 left-2">
            <AccessBadge kind={kind} />
          </div>
        )}
      </div>
      {src && <div className="mt-2 truncate text-sm font-medium">{movie.title}</div>}
      {meta.length > 0 && (
        <div className="text-xs text-muted">
          {movie.rating && <span>{`★ ${movie.rating}`}</span>}
          {movie.rating && movie.year && ' · '}
          {movie.year && <span>{movie.year}</span>}
        </div>
      )}
    </Link>
  )
}
