import Link from 'next/link'

export default function FilmeNaoEncontrado() {
  return (
    <div className="relative isolate mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-(--gutter) py-24 text-center">
      <h1 className="font-display text-5xl leading-[0.95] font-black text-balance uppercase">Filme não encontrado</h1>
      <p className="mt-4 text-fg/70">Não encontramos esse filme no catálogo.</p>
      <Link href="/" className="mt-8 inline-flex rounded-full btn-light px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.04]">
        Voltar para a Vitrine
      </Link>
    </div>
  )
}
