export default function Footer() {
  return (
    <footer className="relative mt-8 border-t border-white/[0.06] px-(--gutter) py-10 text-sm text-muted">
      <div
        aria-hidden
        className="absolute inset-x-0 -top-px mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-accent/50 to-transparent"
      />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p>Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.</p>
          <p>Dados de onde assistir: JustWatch</p>
        </div>
        <span aria-hidden className="font-display text-2xl font-black tracking-[0.12em] text-fg/15">
          CINE
        </span>
      </div>
    </footer>
  )
}
