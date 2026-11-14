import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { FavoriteButton } from '@/components/FavoriteButton'
import { MovieRow } from '@/components/MovieRow'
import { WhereToWatch } from '@/components/WhereToWatch'
import { getFavoriteIds } from '@/lib/favorites'
import { isNumericRating } from '@/lib/format'
import { getCurrentUser } from '@/lib/supabase/server'
import { imageUrl } from '@/lib/tmdb/client'
import { getMovieDetail } from '@/lib/tmdb/movies'

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

  const [user, favoriteIds] = await Promise.all([getCurrentUser(), getFavoriteIds()])
  const backdrop = imageUrl(movie.backdropPath, 'w1280')
  const poster = imageUrl(movie.posterPath, 'w780')
  const meta = [movie.year, movie.runtime, movie.genres.join(', ') || null].filter(Boolean)

  return (
    <div>
      <div className="relative bg-panel">
        {backdrop && (
          <>
            <Image
              src={backdrop}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30" />
          </>
        )}
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
          <div className="relative aspect-[2/3] w-48 shrink-0 self-center overflow-hidden rounded-lg bg-panel md:w-64 md:self-start">
            {poster && (
              <Image
                src={poster}
                alt={movie.title}
                fill
                priority
                sizes="256px"
                className="object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{movie.title}</h1>
            {meta.length > 0 && <p className="mt-2 text-muted">{meta.join(' · ')}</p>}
            {movie.rating &&
              (isNumericRating(movie.rating) ? (
                <p className="mt-2">
                  <span className="font-semibold text-accent">{`★ ${movie.rating}`}</span>{' '}
                  <span className="text-sm text-muted">
                    ({movie.voteCount.toLocaleString('pt-BR')} votos)
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">{movie.rating}</p>
              ))}
            {movie.directors.length > 0 && (
              <p className="mt-2 text-sm">
                <span className="text-muted">Direção: </span>
                {movie.directors.join(', ')}
              </p>
            )}
            <p className="mt-4 max-w-3xl leading-relaxed">
              {movie.overview || 'Sinopse indisponível em português.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-muted px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
                >
                  Ver trailer
                </a>
              )}
              <FavoriteButton
                movie={{
                  movieId: movie.id,
                  title: movie.title,
                  posterPath: movie.posterPath,
                  releaseYear: movie.year,
                }}
                initialFavorited={favoriteIds.has(movie.id)}
                isLoggedIn={Boolean(user)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <WhereToWatch availability={movie.availability} />

        {movie.cast.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-xl font-bold">Elenco</h2>
            <ul className="flex gap-4 overflow-x-auto pb-2">
              {movie.cast.map((c, i) => {
                const photo = imageUrl(c.profilePath, 'w185')
                return (
                  <li key={`${c.name}-${i}`} className="w-24 shrink-0 text-center">
                    <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-panel">
                      {photo ? (
                        <Image src={photo} alt={c.name} fill sizes="80px" className="object-cover" />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-full items-center justify-center text-lg font-semibold text-muted"
                        >
                          {initials(c.name)}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-medium">{c.name}</div>
                    {c.character && <div className="text-xs text-muted">{c.character}</div>}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>

      <MovieRow title="Recomendados" movies={movie.recommendations} />
      <div className="h-8" />
    </div>
  )
}
