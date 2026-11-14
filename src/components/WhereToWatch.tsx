import Image from 'next/image'
import type { Availability } from '@/lib/tmdb/availability'
import { imageUrl } from '@/lib/tmdb/client'

export function WhereToWatch({ availability }: { availability: Availability }) {
  return (
    <section className="rounded-lg bg-panel p-4">
      <h2 className="font-display text-lg font-bold">Onde assistir</h2>
      {availability.available ? (
        <div className="mt-3 space-y-3">
          {availability.groups.map((g) => (
            <div key={g.kind}>
              <h3 className="text-sm font-medium text-muted">{g.label}</h3>
              <ul className="mt-2 flex flex-wrap gap-3">
                {g.providers.map((p) => {
                  const logo = imageUrl(p.logoPath, 'w92')
                  return (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      {logo && (
                        <Image
                          src={logo}
                          alt=""
                          width={32}
                          height={32}
                          className="rounded-md"
                        />
                      )}
                      <span>{p.name}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {availability.link && (
            <a
              href={availability.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-90"
            >
              Ver opções
            </a>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Este filme não está disponível em streaming no Brasil no momento.
        </p>
      )}
      <p className="mt-4 text-xs text-muted">Dados de onde assistir: JustWatch</p>
    </section>
  )
}
