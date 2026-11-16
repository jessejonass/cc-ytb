# Filtro por Nota Mínima Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Filtro "Nota mínima" (6+/7+/8+) no Catálogo e atalhos 7+/8+ na página inicial que levam ao Catálogo filtrado.

**Architecture:** O estado do filtro vive na URL (`?nota=`), como os demais filtros do Catálogo. `src/lib/tmdb/catalog.ts` (funções puras) ganha o campo `minRating` no parse, na serialização e nos parâmetros do `/discover/movie` do TMDB. O painel cliente ganha chips; a inicial ganha um componente de atalhos no cabeçalho do trilho "Mais bem avaliados no streaming".

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind 4, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-16-filtro-nota-design.md`

## Global Constraints

- Parâmetro de URL: `nota`. Valores aceitos: `6`, `7`, `8`; qualquer outro → sem filtro.
- Com nota mínima: `vote_average.gte=<nota>` e `vote_count.gte=100` no discover.
- Rótulos dos chips: `6+`, `7+`, `8+` (Catálogo); `7+`, `8+` (inicial).
- Atalhos da inicial: `/catalogo?nota=7&ordem=nota` e `/catalogo?nota=8&ordem=nota`.
- Os trilhos da inicial não são filtrados. Nada de nota máxima ou faixa.
- Texto de UI em português; seguir o estilo visual existente (chips de década).
- O working tree tem alterações não commitadas do usuário em `src/app/page.tsx`, `src/components/CatalogFilters.tsx` e `src/components/MovieRow.tsx`: editar sobre o estado atual. Se esses arquivos ainda tiverem alterações do usuário fora desta feature na hora do commit, NÃO commitá-los (nada de `git add -p`, que é interativo): commitar só os outros arquivos da task e avisar o usuário.
- Git no Windows/WSL: use `git -c safe.directory=* ...` se aparecer "dubious ownership".

## Review Focus

1. `?nota=7.5`, `?nota=10`, `?nota=abc`, `?nota=` → ignorado (sem filtro), sem erro. (Task 1, teste "descarta notas inválidas")
2. Nota combinada com `ordem=nota`: `vote_count.gte` continua 100, não duplicado/conflitante. (Task 1, teste "nota com ordem por nota")
3. Mudar a nota volta para a página 1 (não ficar na página 40 de um resultado com 3 páginas). Já garantido por `update()` no painel; Task 2 verifica a URL sem `pagina`.
4. Clicar no chip ativo limpa o filtro. (Task 2)
5. Ciclo URL → parse preserva cada valor de nota. (Task 1, teste de ida e volta)

---

### Task 1: `minRating` nas funções de catálogo

**Files:**
- Modify: `src/lib/tmdb/catalog.ts`
- Test: `tests/lib/tmdb/catalog.test.ts`

**Interfaces:**
- Produces:
  - `CatalogFilters.minRating: number | null` (campo novo, obrigatório no tipo).
  - `export const MIN_RATINGS = [6, 7, 8] as const`
  - `parseCatalogFilters` lê `sp.nota`; `buildCatalogUrl` grava `nota` (ordem dos parâmetros: depois de `ate`, antes de `ordem`); `buildDiscoverParams` envia `vote_average.gte` + `vote_count.gte: 100`.

- [ ] **Step 1: Atualizar os testes existentes e escrever os novos**

Adicionar `minRating: null` ao objeto `base` e aos literais completos de `CatalogFilters`/resultado em `parseCatalogFilters` ("descarta valores inválidos"), `buildDiscoverParams` ("monta parâmetros completos") e `buildCatalogUrl`. Novos testes:

```ts
// describe('parseCatalogFilters')
it('lê nota mínima válida', () => {
  expect(parseCatalogFilters({ nota: '7' }).minRating).toBe(7)
  expect(parseCatalogFilters({ nota: ['8', '6'] }).minRating).toBe(8)
})
it('descarta notas inválidas', () => {
  for (const nota of ['7.5', '10', '9', '0', 'abc', '', '-7']) {
    expect(parseCatalogFilters({ nota }).minRating).toBeNull()
  }
})

// describe('buildDiscoverParams')
it('filtra por nota mínima com piso de votos', () => {
  const p = buildDiscoverParams({ ...base, minRating: 8 }, [8])
  expect(p['vote_average.gte']).toBe(8)
  expect(p['vote_count.gte']).toBe(100)
  expect(p.sort_by).toBe('popularity.desc')
})
it('nota com ordem por nota', () => {
  const p = buildDiscoverParams({ ...base, minRating: 7, sort: 'nota' }, [8])
  expect(p['vote_average.gte']).toBe(7)
  expect(p['vote_count.gte']).toBe(100)
  expect(p.sort_by).toBe('vote_average.desc')
})
it('sem nota mínima não envia vote_average.gte', () => {
  expect(buildDiscoverParams(base, [8])).not.toHaveProperty('vote_average.gte')
})

// describe('buildCatalogUrl')
it('serializa nota', () => {
  expect(buildCatalogUrl({ ...base, minRating: 7, sort: 'nota' })).toBe('/catalogo?nota=7&ordem=nota')
})

// novo describe('MIN_RATINGS')
it('cada nota sobrevive ao ciclo URL -> parse', () => {
  for (const r of MIN_RATINGS) {
    const url = buildCatalogUrl({ ...base, minRating: r })
    const sp = Object.fromEntries(new URL(url, 'http://x').searchParams)
    expect(parseCatalogFilters(sp).minRating).toBe(r)
  }
})
```

No teste "serializa só o que difere do padrão", incluir `minRating: 8` no objeto completo e esperar `'/catalogo?servicos=8&generos=27&de=1980&ate=1989&nota=8&ordem=nota&pagina=2'`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/lib/tmdb/catalog.test.ts`
Expected: FAIL (`MIN_RATINGS` não exportado / `minRating` ausente).

- [ ] **Step 3: Implementar em `src/lib/tmdb/catalog.ts`**

`parseMinRating(v)`: usa `first(v)`, aceita só string que seja exatamente um dos `MIN_RATINGS` (`/^\d+$/` + `includes`). Em `buildDiscoverParams`, setar `vote_count.gte = 100` quando `minRating !== null` ou `sort === 'nota'` (uma vez só).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/lib/tmdb/catalog.test.ts`
Expected: PASS. Depois `npx tsc --noEmit`: sem erros (a página do Catálogo usa `parseCatalogFilters`, então já recebe o campo).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tmdb/catalog.ts tests/lib/tmdb/catalog.test.ts
git commit -m "feat(catalogo): filtro de nota mínima na URL e no discover"
```

---

### Task 2: Chips "Nota mínima" no painel do Catálogo

**Files:**
- Modify: `src/components/CatalogFilters.tsx`
- Create test: `tests/components/CatalogFilters.test.tsx`

**Interfaces:**
- Consumes: `MIN_RATINGS`, `CatalogFilters.minRating`, `buildCatalogUrl` (Task 1).

- [ ] **Step 1: Escrever o teste**

Mock de `next/navigation` no padrão de `tests/components/SearchBox.test.tsx`, com `useRouter: () => ({ push })` e `push = vi.fn()` hoisted. Renderizar `<CatalogFilters filters={...} featured={[]} others={[]} genres={[]} />`.

```ts
it('mostra a seção Nota mínima com 6+, 7+ e 8+', () => {
  render(<CatalogFilters filters={base} featured={[]} others={[]} genres={[]} />)
  expect(screen.getByRole('heading', { name: 'Nota mínima' })).toBeInTheDocument()
  for (const l of ['6+', '7+', '8+']) expect(screen.getByRole('button', { name: l })).toBeInTheDocument()
})
it('escolher nota volta para a página 1', () => {
  render(<CatalogFilters filters={{ ...base, page: 4 }} featured={[]} others={[]} genres={[]} />)
  fireEvent.click(screen.getByRole('button', { name: '7+' }))
  expect(push).toHaveBeenCalledWith('/catalogo?nota=7')
})
it('clicar no chip ativo limpa a nota', () => {
  render(<CatalogFilters filters={{ ...base, minRating: 8 }} featured={[]} others={[]} genres={[]} />)
  const chip = screen.getByRole('button', { name: '8+' })
  expect(chip).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(chip)
  expect(push).toHaveBeenCalledWith('/catalogo')
})
```

(`base` = filtros padrão com `minRating: null`; `beforeEach(() => push.mockClear())`.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/components/CatalogFilters.test.tsx`
Expected: FAIL (não encontra o heading "Nota mínima").

- [ ] **Step 3: Implementar**

Seção `<h3 className={heading}>Nota mínima</h3>` entre "Década" e "Ordenar por", com um botão por `MIN_RATINGS` (rótulo `` `${r}+` ``), mesmas classes e `aria-pressed` dos chips de década; ativo → `update({ minRating: null })`, senão `update({ minRating: r })`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/components/CatalogFilters.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/components/CatalogFilters.test.tsx
git add src/components/CatalogFilters.tsx   # só se não houver alterações do usuário pendentes nele (ver Global Constraints)
git commit -m "feat(catalogo): chips de nota mínima no painel de filtros"
```

---

### Task 3: Atalhos 7+/8+ na página inicial

**Files:**
- Create: `src/components/RatingShortcuts.tsx`
- Modify: `src/components/MovieRow.tsx` (nova prop), `src/app/page.tsx` (trilho "Mais bem avaliados no streaming")
- Create test: `tests/components/RatingShortcuts.test.tsx`

**Interfaces:**
- Consumes: `buildCatalogUrl`, `parseCatalogFilters` (Task 1).
- Produces:
  - `export function RatingShortcuts({ ratings = [7, 8] }: { ratings?: number[] })`: componente de servidor (sem `'use client'`) que renderiza um `<Link>` por nota, com rótulo `` `${r}+` ``, `aria-label` `` `Filmes com nota ${r} ou mais` `` e href `buildCatalogUrl({ ...parseCatalogFilters({}), minRating: r, sort: 'nota' })`.
  - `MovieRow` ganha `action?: ReactNode`, usado no lugar do link "Ver tudo" quando `href` não é passado.

- [ ] **Step 1: Escrever o teste**

```ts
it('leva ao catálogo filtrado e ordenado por nota', () => {
  render(<RatingShortcuts />)
  expect(screen.getByRole('link', { name: 'Filmes com nota 7 ou mais' })).toHaveAttribute('href', '/catalogo?nota=7&ordem=nota')
  expect(screen.getByRole('link', { name: 'Filmes com nota 8 ou mais' })).toHaveAttribute('href', '/catalogo?nota=8&ordem=nota')
  expect(screen.getByText('7+')).toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/components/RatingShortcuts.test.tsx`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

`RatingShortcuts` com chips pequenos no visual dos chips de década (borda `white/15`, hover `accent`). Em `MovieRow`, `action={href ? <link Ver tudo/> : action}`. Em `page.tsx`, passar `action={<RatingShortcuts />}` no `MovieRow` "Mais bem avaliados no streaming".

- [ ] **Step 4: Rodar a suíte inteira e checar tipos/lint**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: tudo passa.

- [ ] **Step 5: Conferir no app**

Run: `npm run dev`. Na inicial, ver `7+ 8+` ao lado de "Mais bem avaliados no streaming"; clicar em `8+` → Catálogo com chip `8+` ativo, "Ordenar por: Nota" e todos os pôsteres com ★ ≥ 8,0. No Catálogo, alternar 6+/7+/8+ e desmarcar.

- [ ] **Step 6: Commit**

```bash
git add src/components/RatingShortcuts.tsx tests/components/RatingShortcuts.test.tsx
git add src/components/MovieRow.tsx src/app/page.tsx   # idem
git commit -m "feat(home): atalhos de nota mínima para o catálogo"
```
