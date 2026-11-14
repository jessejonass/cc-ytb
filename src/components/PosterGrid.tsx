import { PosterCard } from '@/components/PosterCard'
import type { MovieCard } from '@/lib/tmdb/movies'

export function PosterGrid({ movies, emptyText }: { movies: MovieCard[]; emptyText: string }) {
  if (movies.length === 0) {
    return <p className="py-16 text-center text-muted">{emptyText}</p>
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-4">
      {movies.map((m) => (
        <div key={m.id} className="[&>a]:w-full">
          <PosterCard movie={m} />
        </div>
      ))}
    </div>
  )
}
