import Link from 'next/link'

export default function PaginaNaoEncontrada() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Página não encontrada</h1>
      <p className="mt-3 text-muted">O endereço que você abriu não existe.</p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">
        Voltar para a Vitrine
      </Link>
    </div>
  )
}
