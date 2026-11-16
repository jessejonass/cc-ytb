'use client'

import { useState, type ReactNode } from 'react'

const SLIDE_MS = 8000

/**
 * Empilha os destaques numa mesma célula de grid e faz crossfade.
 * O tempo é a própria animação CSS da barra: hover nos indicadores ou foco de
 * teclado pausam a barra,
 * e com movimento reduzido a barra não anima, então não há autoplay.
 */
export function HeroCarousel({ slides }: { slides: { key: number; title: string; node: ReactNode }[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da semana"
      className="relative"
      // Só foco de teclado pausa: o clique num indicador também foca o botão,
      // e isso deixaria o carrossel pausado até o usuário clicar em outro lugar.
      onFocus={(e) => {
        if (e.target.matches(':focus-visible')) setPaused(true)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <div className="grid">
        {slides.map((s, i) => (
          <div
            key={s.key}
            data-active={i === active}
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${count}: ${s.title}`}
            aria-hidden={i !== active}
            inert={i !== active}
            className="[grid-area:1/1] transition-opacity duration-[1200ms] ease-out data-[active=false]:pointer-events-none data-[active=false]:opacity-0"
          >
            {s.node}
          </div>
        ))}
      </div>

      {count > 1 && (
        // O hover pausa só sobre os indicadores: o hero ocupa quase a tela toda,
        // então pausar no hover dele inteiro travava o autoplay na prática.
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="absolute bottom-32 left-(--gutter) z-10 flex items-center gap-1.5 sm:bottom-48 sm:gap-2 md:right-(--gutter) md:left-auto"
        >
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Mostrar destaque ${i + 1}: ${s.title}`}
              aria-current={i === active}
              className="group relative h-8 w-10 lg:w-14"
            >
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/45">
                {i < active && <span className="absolute inset-0 bg-fg/80" />}
                {i === active && (
                  <span
                    key={`${active}`}
                    className="hero-progress absolute inset-0 origin-left animate-fill bg-gradient-to-r from-accent to-ember"
                    style={{ '--slide-ms': `${SLIDE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' } as React.CSSProperties}
                    onAnimationEnd={() => setActive((a) => (a + 1) % count)}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
