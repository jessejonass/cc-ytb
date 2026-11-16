import { FavoriteButton } from '@/components/FavoriteButton'
import { Hero } from '@/components/Hero'
import { HomeTabs } from '@/components/HomeTabs'
import { HeroCarousel } from '@/components/HeroCarousel'
import { MovieRow } from '@/components/MovieRow'
import { RatingShortcuts } from '@/components/RatingShortcuts'
import { getFavoriteIds } from '@/lib/favorites'
import { FEATURED_PROVIDERS } from '@/lib/providers'
import { getCurrentUser } from '@/lib/supabase/server'
import {
  getByProvider,
  getTopRated,
  getTrendingAvailable,
  type MovieCard,
} from '@/lib/tmdb/movies'

export const revalidate = 3600

const HERO_COUNT = 5

function valueOr(r: PromiseSettledResult<MovieCard[]>): MovieCard[] {
  return r.status === 'fulfilled' ? r.value : []
}

export default async function Home() {
  const [trendingR, topR, ...providerR] = await Promise.allSettled([
    getTrendingAvailable(),
    getTopRated(),
    ...FEATURED_PROVIDERS.map((p) => getByProvider(p.id)),
  ])
  const trending = valueOr(trendingR)
  // a posição no ranking acompanha o slide, mesmo pulando filmes sem backdrop
  const heroes = trending
    .map((movie, i) => ({ movie, rank: i + 1 }))
    .filter((h) => h.movie.backdropPath)
    .slice(0, HERO_COUNT)
  const [user, favoriteIds] = await Promise.all([getCurrentUser(), getFavoriteIds()])

  return (
    <div className="pb-16">
      {heroes.length > 0 ? (
        <div className="relative -mt-(--header-h)">
          {/* abas sobre o topo do destaque; o Hero reserva o espaço no padding do texto */}
          <div className="absolute inset-x-0 top-[calc(var(--header-h)+1rem)] z-20">
            <HomeTabs active="inicio" />
          </div>
          <HeroCarousel
            slides={heroes.map(({ movie, rank }, i) => ({
              key: movie.id,
              title: movie.title,
              node: (
                <Hero
                  movie={movie}
                  rank={rank}
                  priority={i === 0}
                  favoriteSlot={
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
                  }
                />
              ),
            }))}
          />
        </div>
      ) : (
        <div className="pt-6 pb-2">
          <HomeTabs active="inicio" />
        </div>
      )}

      <div className={`relative z-10 ${heroes.length > 0 ? '-mt-28 sm:-mt-36' : ''}`}>
        <RatingShortcuts />
        <MovieRow title="Top 10 da semana" movies={trending} ranked />
        <MovieRow title="Mais bem avaliados no streaming" movies={valueOr(topR)} />
        {FEATURED_PROVIDERS.map((p, i) => (
          <MovieRow
            key={p.id}
            title={p.rowTitle}
            movies={valueOr(providerR[i])}
            href={`/catalogo?servicos=${p.id}`}
          />
        ))}
      </div>
    </div>
  )
}
