import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { FavoriteButton } from '@/components/FavoriteButton'
import { MovieRow } from '@/components/MovieRow'
import { Rail } from '@/components/Rail'
import { WhereToWatch } from '@/components/WhereToWatch'
import { WatchStatusButtons } from '@/components/WatchStatusButtons'
import { Play, Star } from '@/components/icons'
import { getFavoriteIds } from '@/lib/favorites'
import { isNumericRating } from '@/lib/format'
import { getCurrentUser } from '@/lib/supabase/server'
import { imageUrl } from '@/lib/tmdb/client'
import { getMovieDetail } from '@/lib/tmdb/movies'
import { getWatchStatus } from '@/lib/watch-status'

export const revalidate = 86400

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const movie = await getMovieDetail(id)
  if (!movie) return { title: 'Filme não encontrado' }
  return {
    title: movie.title,
    description: movie.overview || undefined,
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export default async function FilmePage({ params }: Props) {
  const { id } = await params
  const movie = await getMovieDetail(id)
  if (!movie) notFound()

  const [user, favoriteIds, watchStatus] = await Promise.all([
    getCurrentUser(),
    getFavoriteIds(),
    getWatchStatus(movie.id),
  ])
  const backdrop = imageUrl(movie.backdropPath, 'w1280')
  const ambient = imageUrl(movie.backdropPath ?? movie.posterPath, 'w342')
  const poster = imageUrl(movie.posterPath, 'w780')
  const facts = [movie.year, movie.runtime].filter(Boolean)

  return (
    <div className="pb-16">
      <div className="relative isolate -mt-(--header-h)">
        {ambient && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-30 h-[130%] overflow-hidden opacity-50">
            <Image src={ambient} alt="" fill sizes="342px" className="scale-125 object-cover blur-3xl saturate-150" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/60 to-bg" />
          </div>
        )}
        {backdrop && (
          <div aria-hidden className="absolute inset-x-0 top-0 -z-20 h-[min(88svh,820px)] overflow-hidden [mask-image:linear-gradient(to_bottom,black_50%,transparent)]">
            <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-[70%_20%] opacity-80" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-bg)_0%,rgb(13_10_18/0.85)_35%,rgb(13_10_18/0.2)_75%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/50 to-transparent to-30%" />
          </div>
        )}

        <div className="flex flex-col gap-8 px-(--gutter) pt-[calc(var(--header-h)+2.5rem)] pb-10 md:flex-row md:items-end md:gap-12 md:pt-[calc(var(--header-h)+8rem)]">
          <div className="relative aspect-[2/3] w-52 shrink-0 self-center animate-rise overflow-hidden rounded-2xl bg-panel shadow-[0_30px_70px_-20px_rgb(0_0_0/0.95)] ring-1 ring-white/10 md:w-72 md:self-end">
            {poster && (
              <Image src={poster} alt={movie.title} fill priority sizes="288px" className="object-cover" />
            )}
          </div>

          <div className="min-w-0 flex-1 animate-rise [animation-delay:120ms]">
            {movie.genres.length > 0 && (
              <ul className="mb-4 flex flex-wrap gap-2" aria-label="Gêneros">
                {movie.genres.map((g) => (
                  <li key={g} className="rounded-full glass px-3 py-1 text-xs font-medium text-fg/90">
                    {g}
                  </li>
                ))}
              </ul>
            )}
            <h1 className="max-w-4xl font-display text-[clamp(2.75rem,6.5vw,5.75rem)] leading-[0.88] font-black text-balance uppercase drop-shadow-[0_4px_30px_rgb(0_0_0/0.6)]">
              {movie.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              {movie.rating &&
                (isNumericRating(movie.rating) ? (
                  <p className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-lg font-bold text-accent ring-1 ring-accent/40">
                      <Star className="h-4 w-4" />
                      <span aria-hidden>{movie.rating}</span>
                      <span className="sr-only">{`★ ${movie.rating}`}</span>
                    </span>
                    <span className="text-sm text-muted">
                      ({movie.voteCount.toLocaleString('pt-BR')} votos)
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted">{movie.rating}</p>
                ))}
              {facts.length > 0 && (
                <p className="flex gap-4 text-fg/80">
                  {facts.map((f) => (
                    <span key={f}>{f}</span>
                  ))}
                </p>
              )}
            </div>

            {movie.directors.length > 0 && (
              <p className="mt-3 text-sm">
                <span className="text-muted">Direção </span>
                <span className="font-medium">{movie.directors.join(', ')}</span>
              </p>
            )}
            <p className="mt-5 max-w-[62ch] text-[1.02rem] leading-relaxed text-fg/85">
              {movie.overview || 'Sinopse indisponível em português.'}
            </p>
            <div className="mt-7 flex flex-wrap items-start gap-3">
              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full btn-light px-6 py-3 text-[0.95rem] font-semibold transition-transform hover:scale-[1.04] active:scale-95"
                >
                  <Play />
                  Ver trailer
                </a>
              )}
              <FavoriteButton
                size="lg"
                movie={{
                  movieId: movie.id,
                  title: movie.title,
                  posterPath: movie.posterPath,
                  releaseYear: movie.year,
                }}
                initialFavorited={favoriteIds.has(movie.id)}
                isLoggedIn={Boolean(user)}
              />
              <WatchStatusButtons
                movie={{
                  movieId: movie.id,
                  title: movie.title,
                  posterPath: movie.posterPath,
                  releaseYear: movie.year,
                }}
                initialStatus={watchStatus}
                isLoggedIn={Boolean(user)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-(--gutter)">
        <WhereToWatch availability={movie.availability} />
      </div>

      {movie.cast.length > 0 && (
        <div className="mt-10">
          <Rail
            label="Elenco"
            heading={
              <h2 className="font-display text-[1.65rem] leading-none font-extrabold tracking-wide sm:text-3xl">
                Elenco
              </h2>
            }
          >
            {movie.cast.map((c, i) => {
              const photo = imageUrl(c.profilePath, 'w185')
              return (
                <li key={`${c.name}-${i}`} className="w-28 shrink-0 snap-start text-center sm:w-32">
                  <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-panel ring-2 ring-white/10 sm:h-28 sm:w-28">
                    {photo ? (
                      <Image src={photo} alt={c.name} fill sizes="112px" className="object-cover" />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-full items-center justify-center bg-gradient-to-br from-panel-2 to-panel font-display text-2xl font-bold text-muted"
                      >
                        {initials(c.name)}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-sm leading-tight font-medium">{c.name}</div>
                  {c.character && (
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted">{c.character}</div>
                  )}
                </li>
              )
            })}
          </Rail>
        </div>
      )}

      <MovieRow title="Recomendados" movies={movie.recommendations} />
    </div>
  )
}
