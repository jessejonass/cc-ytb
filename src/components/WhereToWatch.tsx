import Image from 'next/image'
import type { Availability } from '@/lib/tmdb/availability'
import { imageUrl } from '@/lib/tmdb/client'

export function WhereToWatch({ availability }: { availability: Availability }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-panel-2/90 to-panel/70 p-5 ring-1 ring-white/[0.08] backdrop-blur-md sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl"
      />
      <h2 className="font-display text-[1.65rem] leading-none font-extrabold tracking-wide sm:text-3xl">
        Onde assistir
      </h2>
      {availability.available ? (
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            {availability.groups.map((g) => (
              <div key={g.kind}>
                <h3 className="text-sm font-medium text-muted">{g.label}</h3>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {g.providers.map((p) => {
                    const logo = imageUrl(p.logoPath, 'w92')
                    return (
                      <li
                        key={p.id}
                        className="flex items-center gap-2.5 rounded-xl bg-black/30 py-1.5 pr-3.5 pl-1.5 text-sm font-medium ring-1 ring-white/10"
                      >
                        {logo && (
                          <Image src={logo} alt="" width={32} height={32} className="rounded-lg" />
                        )}
                        <span>{p.name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
          {availability.link && (
            <a
              href={availability.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center self-start rounded-full btn-light px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.04] lg:self-auto"
            >
              Ver opções
            </a>
          )}
        </div>
      ) : (
        <p className="mt-4 text-fg/75">
          Este filme não está disponível em streaming no Brasil no momento.
        </p>
      )}
      <p className="mt-6 text-xs text-muted">Dados de onde assistir: JustWatch</p>
    </section>
  )
}
