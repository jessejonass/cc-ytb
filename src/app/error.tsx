'use client'

import Link from 'next/link'

export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Algo deu errado ao carregar os filmes.</h1>
      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-90"
        >
          Tentar de novo
        </button>
        <Link href="/" className="text-accent hover:underline">
          Voltar para a Vitrine
        </Link>
      </div>
    </div>
  )
}
