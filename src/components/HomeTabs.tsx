import Link from 'next/link'
import { HOME_TABS, type HomeTabKey } from '@/lib/home-tabs'

/** Abas Início · Quero assistir · Já assistidos (cada uma é uma rota). */
export function HomeTabs({ active }: { active: HomeTabKey }) {
  return (
    <nav aria-label="Abas da inicial" className="px-(--gutter)">
      <div className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full glass p-1">
        {HOME_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.key === active ? 'page' : undefined}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-fg/70 transition-colors hover:text-fg aria-[current=page]:bg-white/90 aria-[current=page]:text-bg sm:px-5"
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
