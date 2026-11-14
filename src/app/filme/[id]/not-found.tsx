import Link from 'next/link'

export default function FilmeNaoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Filme não encontrado</h1>
      <p className="mt-3 text-muted">Não encontramos esse filme no catálogo.</p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">
        Voltar para a Vitrine
      </Link>
    </div>
  )
}
