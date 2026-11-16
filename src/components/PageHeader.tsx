import type { ReactNode } from 'react'

/** Título de página interna, com o brilho âmbar do projetor por trás. */
export function PageHeader({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="relative isolate pt-8 pb-6 sm:pt-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-[-10%] -z-10 h-80 w-[70%] rounded-full bg-[radial-gradient(closest-side,rgb(244_179_61/0.16),rgb(232_87_42/0.08)_55%,transparent)] blur-2xl"
      />
      <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9] font-black text-balance uppercase">
        {title}
      </h1>
      {children && <div className="mt-3 text-muted">{children}</div>}
    </div>
  )
}
