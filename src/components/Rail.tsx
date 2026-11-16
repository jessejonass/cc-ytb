'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from './icons'

/**
 * Trilho horizontal: rola por "páginas" com botões laterais, mostra em que
 * página você está e esconde a barra de rolagem nativa. Toque/arraste continua
 * funcionando no celular (scroll-snap).
 */
export function Rail({
  label,
  heading,
  action,
  children,
}: {
  label: string
  heading?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [state, setState] = useState({ prev: false, next: false, page: 0, pages: 1 })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05))
    const page = max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (pages - 1))
    setState({ prev: el.scrollLeft > 4, next: el.scrollLeft < max - 4, page, pages })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      ro.disconnect()
    }
  }, [measure])

  function go(dir: 1 | -1) {
    const el = ref.current
    if (!el) return
    const gutter = parseFloat(getComputedStyle(el).paddingLeft) || 0
    el.scrollBy({ left: dir * (el.clientWidth - gutter * 2), behavior: 'smooth' })
  }

  const arrow =
    'absolute top-6 bottom-14 z-20 hidden w-(--gutter) min-w-12 items-center justify-center text-fg opacity-0 transition-opacity duration-300 group-hover/rail:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none disabled:!opacity-0 sm:flex'

  return (
    <section aria-label={label} className="group/rail relative">
      {(heading || action) && (
        <div className="mb-1 flex items-end justify-between gap-4 px-(--gutter)">
          <div className="flex items-baseline gap-4">
            {heading}
            {action}
          </div>
          {state.pages > 1 && (
            <div aria-hidden className="hidden gap-1 opacity-0 transition-opacity group-hover/rail:opacity-100 sm:flex">
              {Array.from({ length: state.pages }, (_, i) => (
                <span
                  key={i}
                  className={`h-0.5 w-4 rounded-full transition-colors duration-300 ${
                    i === state.page ? 'bg-accent' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          aria-label={`Voltar em ${label}`}
          onClick={() => go(-1)}
          disabled={!state.prev}
          className={`${arrow} left-0 rounded-r-lg bg-gradient-to-r from-bg via-bg/80 to-transparent`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full glass transition-transform hover:scale-110 hover:border-accent/60">
            <ChevronLeft />
          </span>
        </button>
        <ul
          ref={ref}
          // overflow-x:auto força overflow-y:auto pela spec; sem o hidden, o que vaza
          // na vertical (ex.: numerais do Top 10) vira scroll e prende a roda do mouse.
          // O padding extra (compensado pela margem negativa) dá espaço para a sombra
          // do hover, que o contêiner de scroll recortaria na borda do padding.
          className="no-scrollbar -mt-2 -mb-10 flex snap-x snap-mandatory scroll-px-(--gutter) gap-3 overflow-x-auto overflow-y-hidden scroll-smooth px-(--gutter) pt-6 pb-14 sm:gap-4"
        >
          {children}
        </ul>
        <button
          type="button"
          aria-label={`Avançar em ${label}`}
          onClick={() => go(1)}
          disabled={!state.next}
          className={`${arrow} right-0 rounded-l-lg bg-gradient-to-l from-bg via-bg/80 to-transparent`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full glass transition-transform hover:scale-110 hover:border-accent/60">
            <ChevronRight />
          </span>
        </button>
      </div>
    </section>
  )
}
