import Link from 'next/link'
import { PosterCard } from '@/components/PosterCard'
import { Rail } from '@/components/Rail'
import type { MovieCard } from '@/lib/tmdb/movies'
import { ChevronRight } from './icons'

export function MovieRow({
  title,
  movies,
  href,
  ranked = false,
}: {
  title: string
  movies: MovieCard[]
  href?: string
  /** Top 10: numerais gigantes atrás do pôster, na ordem do ranking. */
  ranked?: boolean
}) {
  if (movies.length === 0) return null
  const list = ranked ? movies.slice(0, 10) : movies
  return (
    <div className="mt-6 sm:mt-8">
      <Rail
        label={title}
        heading={
          <h2 className="font-display text-[1.65rem] leading-none font-extrabold tracking-wide sm:text-3xl">
            {title}
          </h2>
        }
        action={
          href && (
            <Link
              href={href}
              className="group/more inline-flex items-center gap-0.5 text-sm font-medium text-accent/90 transition-colors hover:text-accent"
            >
              Ver tudo
              <ChevronRight className="h-4 w-4 transition-transform group-hover/more:translate-x-1" />
            </Link>
          )
        }
      >
        {list.map((m, i) =>
          ranked ? (
            <li key={m.id} className="flex shrink-0 snap-start items-end">
              <span
                aria-hidden
                className="relative -mr-4 -mb-1 font-display text-[9rem] leading-[0.75] font-black tracking-[-0.06em] text-transparent select-none [-webkit-text-stroke:2.5px_rgb(244_179_61/0.9)] sm:-mr-5 sm:text-[12.5rem]"
              >
                {i + 1}
              </span>
              <div className="relative">
                <PosterCard movie={m} rank={i + 1} caption={false} />
              </div>
            </li>
          ) : (
            <li key={m.id} className="shrink-0 snap-start">
              <PosterCard movie={m} />
            </li>
          ),
        )}
      </Rail>
    </div>
  )
}
