import { Hero } from '@/components/Hero'
import { MovieRow } from '@/components/MovieRow'
import { FEATURED_PROVIDERS } from '@/lib/providers'
import {
  getByProvider,
  getTopRated,
  getTrendingAvailable,
  pickHero,
  type MovieCard,
} from '@/lib/tmdb/movies'

export const revalidate = 3600

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
  const hero = pickHero(trending)

  return (
    <div className="pb-12">
      {hero && <Hero movie={hero} />}
      <MovieRow title="Em alta na semana" movies={trending} />
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
  )
}
