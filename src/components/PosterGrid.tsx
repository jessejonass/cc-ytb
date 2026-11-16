import { PosterCard } from '@/components/PosterCard'
import type { MovieCard } from '@/lib/tmdb/movies'

export function PosterGrid({ movies, emptyText }: { movies: MovieCard[]; emptyText: string }) {
  if (movies.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 py-20 text-center text-muted">
        {emptyText}
      </p>
    )
  }
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] sm:gap-x-5">
      {movies.map((m, i) => (
        <li
          key={m.id}
          className="animate-rise [&>a]:w-full"
          style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
        >
          <PosterCard movie={m} />
        </li>
      ))}
    </ul>
  )
}
