import Image from 'next/image'
import Link from 'next/link'
import { AccessBadge } from '@/components/AccessBadge'
import { ratingLabel } from '@/lib/format'
import { imageUrl } from '@/lib/tmdb/client'
import type { MovieCard } from '@/lib/tmdb/movies'

export function PosterCard({
  movie,
  rank,
  caption = true,
}: {
  movie: MovieCard
  rank?: number
  /** Título e nota abaixo do pôster; o Top 10 esconde para os numerais respirarem. */
  caption?: boolean
}) {
  const src = imageUrl(movie.posterPath, 'w342')
  const kind = movie.kinds?.[0]
  const rating = ratingLabel(movie.rating)
  const meta = [rating, movie.year].filter(Boolean)
  return (
    <Link
      href={`/filme/${movie.id}`}
      aria-label={rank ? `${rank}º lugar: ${movie.title}` : undefined}
      className="group block w-36 shrink-0 outline-none sm:w-44 xl:w-48"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-panel shadow-[0_10px_30px_-12px_rgb(0_0_0/0.9)] ring-1 ring-white/[0.07] transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.035] group-hover:shadow-[0_22px_45px_-14px_rgb(244_179_61/0.45)] group-hover:ring-accent/70 group-focus-visible:ring-2 group-focus-visible:ring-accent">
        {src ? (
          <Image
            src={src}
            alt={movie.title}
            fill
            sizes="(min-width: 1280px) 192px, (min-width: 640px) 176px, 144px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-panel-2 to-panel p-3 text-center font-display text-xl font-bold text-fg/70">
            {movie.title}
          </div>
        )}
        {/* reflexo de luz que atravessa o pôster no hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_35%,rgb(255_255_255/0.18)_50%,transparent_65%)] transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
        {kind && (
          <div className="absolute top-2 left-2">
            <AccessBadge kind={kind} />
          </div>
        )}
      </div>
      {caption && src && (
        <div className="mt-2.5 truncate text-sm font-medium text-fg/90 transition-colors group-hover:text-fg">
          {movie.title}
        </div>
      )}
      {caption && meta.length > 0 && (
        <div className="mt-0.5 flex gap-2 text-xs text-muted">
          {rating && <span className={rating.startsWith('★') ? 'text-accent/90' : undefined}>{rating}</span>}
          {movie.year && <span>{movie.year}</span>}
        </div>
      )}
    </Link>
  )
}
