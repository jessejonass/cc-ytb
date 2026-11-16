'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Início' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/favoritos', label: 'Favoritos' },
]

export function NavLinks() {
  const pathname = usePathname()
  return (
    <>
      {links.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname?.startsWith(l.href)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className="relative py-1 text-fg/65 transition-colors hover:text-fg aria-[current=page]:font-semibold aria-[current=page]:text-fg after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent after:transition-transform aria-[current=page]:after:scale-x-100"
          >
            {l.label}
          </Link>
        )
      })}
    </>
  )
}
