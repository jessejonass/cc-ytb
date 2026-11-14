import { Suspense } from 'react'
import Link from 'next/link'
import SearchBox, { SearchForm } from './SearchBox'
import { signOut } from '@/app/actions/auth'

type HeaderUser = { name: string; avatarUrl: string | null } | null

const links = [
  { href: '/', label: 'Início' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/favoritos', label: 'Favoritos' },
]

export default function Header({ user }: { user: HeaderUser }) {
  return (
    <header className="border-b border-white/10 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-widest text-accent">
          CINE
        </Link>
        <nav
          aria-label="Principal"
          className="order-last flex w-full gap-5 overflow-x-auto whitespace-nowrap text-sm sm:order-none sm:w-auto"
        >
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Suspense fallback={<SearchForm q="" />}>
            <SearchBox />
          </Suspense>
          {user ? (
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
              ) : (
                <span
                  title={user.name}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-panel text-sm"
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <form action={signOut}>
                <button type="submit" className="text-sm text-muted hover:text-fg">
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <Link href="/entrar" className="text-sm text-accent hover:underline">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
