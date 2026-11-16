import { Suspense } from 'react'
import Link from 'next/link'
import SearchBox, { SearchForm } from './SearchBox'
import { HeaderShell } from './HeaderShell'
import { NavLinks } from './NavLinks'
import { signOut } from '@/app/actions/auth'

type HeaderUser = { name: string; avatarUrl: string | null } | null

export default function Header({ user }: { user: HeaderUser }) {
  return (
    <HeaderShell>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-(--gutter) py-3 sm:h-(--header-h) sm:flex-nowrap sm:py-0">
        <Link
          href="/"
          aria-label="CINE, página inicial"
          className="group flex items-center gap-2 font-display text-[1.9rem] leading-none font-black tracking-[0.12em]"
        >
          <span
            aria-hidden
            className="h-6 w-1.5 rounded-full bg-gradient-to-b from-accent to-ember shadow-[0_0_18px_rgb(244_179_61/0.8)] transition-transform group-hover:scale-y-125"
          />
          <span className="bg-gradient-to-r from-fg to-accent bg-clip-text text-transparent">
            CINE
          </span>
        </Link>
        <nav
          aria-label="Principal"
          className="order-last flex w-full gap-6 overflow-x-auto text-[0.95rem] whitespace-nowrap no-scrollbar sm:order-none sm:w-auto"
        >
          <NavLinks />
        </nav>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-4 sm:flex-none">
          <Suspense fallback={<SearchForm q="" />}>
            <SearchBox />
          </Suspense>
          {user ? (
            <div className="flex shrink-0 items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-9 w-9 rounded-full ring-2 ring-accent/60 ring-offset-2 ring-offset-bg"
                />
              ) : (
                <span
                  title={user.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-ember text-sm font-bold text-bg"
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <form action={signOut}>
                <button type="submit" className="text-sm text-fg/60 transition-colors hover:text-fg">
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/entrar"
              className="shrink-0 rounded-full btn-light px-4 py-1.5 text-sm font-semibold transition-transform hover:scale-105"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </HeaderShell>
  )
}
