export default function SearchBox() {
  return (
    <form action="/busca" method="get" role="search" className="w-full sm:w-64">
      <input
        type="search"
        name="q"
        placeholder="Buscar filme…"
        aria-label="Buscar filme"
        className="w-full rounded-full bg-panel px-4 py-2 text-sm text-fg placeholder:text-muted focus:outline-2 focus:outline-accent"
      />
    </form>
  )
}
