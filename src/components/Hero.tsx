import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ratingLabel } from '@/lib/format'
import { imageUrl } from '@/lib/tmdb/client'
import type { MovieCard } from '@/lib/tmdb/movies'
import { Info } from './icons'

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

export function Hero({
  movie,
  favoriteSlot,
  rank = 1,
  priority = true,
}: {
  movie: MovieCard
  favoriteSlot?: ReactNode
  rank?: number
  priority?: boolean
}) {
  const src = imageUrl(movie.backdropPath, 'w1280')
  const ambient = imageUrl(movie.backdropPath, 'w342')
  const rating = ratingLabel(movie.rating)
  const providers = movie.providerNames?.slice(0, 3) ?? []

  return (
    <div className="relative isolate">
      {/* a cor do filme vaza por trás da página (luz do projetor na sala) */}
      {ambient && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-30 h-[135%] overflow-hidden opacity-55">
          <Image src={ambient} alt="" fill sizes="342px" className="scale-125 object-cover blur-3xl saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/60 to-bg" />
        </div>
      )}

      {/* altura mínima, não fixa: título longo empurra o hero para baixo em vez de vazar por cima do header */}
      <div className="relative flex min-h-[max(540px,min(78svh,860px))] flex-col justify-end overflow-hidden">
        {src && (
          <div className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,black_55%,transparent_98%)]">
          <div className="hero-backdrop absolute inset-0 origin-[70%_40%]">
            <Image
              src={src}
              alt=""
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover object-[70%_20%]"
            />
          </div>
          </div>
        )}
        <div aria-hidden className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent)] bg-[linear-gradient(90deg,var(--color-bg)_0%,rgb(13_10_18/0.88)_28%,rgb(13_10_18/0.25)_62%,transparent_100%)]" />
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-bg/70 to-transparent" />

        <div className="hero-copy flex max-w-[44rem] flex-col gap-4 px-(--gutter) pt-[calc(var(--header-h)+1.5rem)] pb-44 sm:pb-48">
          <p className="flex items-center gap-2.5 text-sm font-medium text-fg/85">
            <span className="rounded-md bg-gradient-to-br from-accent to-ember px-2 py-0.5 font-display text-base font-black text-bg">
              #{rank}
            </span>
            em alta na semana
          </p>
          <h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.86] font-black tracking-[-0.01em] text-balance uppercase drop-shadow-[0_4px_30px_rgb(0_0_0/0.6)]">
            {movie.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {rating && (
              <span className={rating.startsWith('★') ? 'font-semibold text-accent' : 'text-fg/70'}>
                {rating}
              </span>
            )}
            {movie.year && <span className="text-fg/80">{movie.year}</span>}
            {providers.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Disponível em">
                {providers.map((p) => (
                  <li key={p} className="rounded-full glass px-2.5 py-0.5 text-xs font-medium text-fg/90">
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {movie.overview && (
            <p className="max-w-[56ch] text-[0.98rem] leading-relaxed text-fg/80">
              {truncate(movie.overview, 200)}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-start gap-3">
            <Link
              href={`/filme/${movie.id}`}
              className="inline-flex items-center gap-2 rounded-full btn-light px-6 py-3 text-[0.95rem] font-semibold transition-transform hover:scale-[1.04] active:scale-95"
            >
              <Info className="h-5 w-5" />
              Ver detalhes
            </Link>
            {favoriteSlot}
          </div>
        </div>
      </div>
    </div>
  )
}
