'use client'

import Link from 'next/link'

export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="relative isolate mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-(--gutter) py-24 text-center">
      <h1 className="font-display text-5xl leading-[0.95] font-black text-balance uppercase">Algo deu errado ao carregar os filmes.</h1>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full btn-light px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.04]"
        >
          Tentar de novo
        </button>
        <Link href="/" className="rounded-full glass px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-white/15">
          Voltar para a Vitrine
        </Link>
      </div>
    </div>
  )
}
