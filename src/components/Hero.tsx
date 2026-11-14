import Image from 'next/image'
import type { ReactNode } from 'react'
import { ratingLabel } from '@/lib/format'
import { imageUrl } from '@/lib/tmdb/client'
import type { MovieCard } from '@/lib/tmdb/movies'

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

export function Hero({
  movie,
  favoriteSlot,
}: {
  movie: MovieCard
  favoriteSlot?: ReactNode
}) {
  const src = imageUrl(movie.backdropPath, 'w1280')
  const meta = [
    movie.year,
    ratingLabel(movie.rating),
    movie.providerNames?.length ? movie.providerNames.join(', ') : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <section className="relative isolate min-h-[420px] overflow-hidden bg-panel">
      {src && (
        <Image src={src} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
      <div className="flex min-h-[420px] max-w-2xl flex-col justify-end gap-3 px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold tracking-widest text-accent">#1 EM ALTA NA SEMANA</p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{movie.title}</h1>
        {meta && <p className="text-sm text-muted">{meta}</p>}
        {movie.overview && <p className="text-sm text-fg/90">{truncate(movie.overview, 200)}</p>}
        {favoriteSlot && <div className="mt-2">{favoriteSlot}</div>}
      </div>
    </section>
  )
}
