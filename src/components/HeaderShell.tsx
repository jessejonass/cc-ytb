'use client'

import { useEffect, useState, type ReactNode } from 'react'

/** Cabeçalho fixo: transparente sobre o destaque, vidro escuro depois de rolar. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 data-[scrolled=false]:bg-gradient-to-b data-[scrolled=false]:from-black/75 data-[scrolled=false]:to-transparent data-[scrolled=true]:bg-bg/80 data-[scrolled=true]:shadow-[0_1px_0_rgb(255_255_255/0.06),0_12px_40px_-12px_rgb(0_0_0/0.8)] data-[scrolled=true]:backdrop-blur-xl"
    >
      {children}
    </header>
  )
}
