import Link from 'next/link'
import { PosterCard } from '@/components/PosterCard'
import type { MovieCard } from '@/lib/tmdb/movies'

export function MovieRow({
  title,
  movies,
  href,
}: {
  title: string
  movies: MovieCard[]
  href?: string
}) {
  if (movies.length === 0) return null
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between px-4 sm:px-6">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-muted hover:text-accent">
            ver tudo
          </Link>
        )}
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
        {movies.map((m) => (
          <PosterCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  )
}
