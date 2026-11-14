# Catálogo de Filmes em Streaming — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site responsivo em pt-BR onde cinéfilos veem filmes disponíveis em streaming no Brasil (dados TMDB), descobrem o que está em alta, buscam, filtram e favoritam filmes com login Google.

**Architecture:** Next.js App Router na Vercel. Toda chamada ao TMDB acontece no servidor (`server-only`), via um único `tmdbFetch` com `revalidate` por tipo de dado. Supabase cuida do login Google (`@supabase/ssr`, cookies) e da tabela `favorites` com RLS; favoritar usa Server Actions e atualização otimista no cliente.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript, Tailwind CSS 4, `@supabase/ssr` + `@supabase/supabase-js`, Vitest + Testing Library (jsdom), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-14-catalogo-filmes-design.md`

## Global Constraints

- O projeto fica em `/home/jessejonas/zcodes/cc-ytb` dentro do WSL (`Ubuntu-26.04`). **Todo comando de terminal roda dentro do WSL**: `wsl -d Ubuntu-26.04 --cd /home/jessejonas/zcodes/cc-ytb -- <comando>` (nos passos abaixo aparece só `<comando>`). Nunca rode `npm` pelo caminho `\\wsl.localhost\...`.
- Região fixa `watch_region=BR`, idioma `language=pt-BR` em toda chamada TMDB.
- "Disponível em streaming" = qualquer forma no BR: `flatrate`, `free`, `ads`, `rent`, `buy`. Nunca filtrar por `with_watch_monetization_types`. Rótulos dos selos: `flatrate` → "Assinatura", `free` → "Grátis", `ads` → "Com anúncios", `rent` → "Aluguel", `buy` → "Compra".
- Nota: apenas TMDB `vote_average`, formatada com uma casa decimal e vírgula (`★ 8,1`); `vote_count` aparece na página do filme. Nenhuma outra fonte de nota.
- `TMDB_READ_TOKEN` só no servidor; nunca `NEXT_PUBLIC_`. Arquivos em `src/lib/tmdb/` importam `server-only`.
- Cache (`fetch` `next.revalidate`, segundos): em alta e fileiras `3600`; catálogo e busca `21600`; detalhe do filme `86400`; gêneros e serviços `604800`.
- Créditos obrigatórios: rodapé com logo/texto TMDB ("Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.") e "Dados de onde assistir: JustWatch" em toda área "onde assistir".
- Login apenas Google. Sem login por e-mail.
- Toda interface em pt-BR. Tema escuro conforme mockup A (https://claude.ai/artifact/YA83uJqvEqTY9BZPxLdp9S): fundo `#121016`, texto `#ece9f1`, secundário `#8e889a`, painel `#1d1a23`, destaque `#e0a526`; títulos em Archivo, texto em Inter (`next/font/google`).
- Serviços em destaque (ids TMDB, região BR): Netflix `8`, Prime Video `119`, Max `1899`, Disney+ `337`, Globoplay `307`. Validar os ids contra `/watch/providers/movie?watch_region=BR` na Task 2 e corrigir aqui se diferirem.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Filme sem imagem ou sem sinopse em pt-BR** (`poster_path`/`backdrop_path` nulos, `overview` vazio): card mostra um pôster de reserva com o título, o destaque da Vitrine pula filmes sem `backdrop_path`, e a página do filme mostra "Sinopse indisponível em português." → testes em Task 3 (`pickHero`) e Task 4 (`PosterCard`).
2. **`/filme/abc` ou id inexistente** (TMDB responde 404): página 404 do Next, nunca erro 500 → testes em Task 2 (`TmdbNotFoundError`) e Task 3 (`getMovieDetail` retorna `null`; ids não numéricos retornam `null` sem chamar a API).
3. **URL do catálogo com valores inválidos** (`pagina=0`, `pagina=9999`, `generos=abc`, `de=3000`, `ordem=xyz`): valores inválidos são descartados e `pagina` fica entre 1 e 500, sem quebrar → testes em Task 5 (`parseCatalogFilters`).
4. **Redirecionamento aberto pelo parâmetro `next` do login** (`next=https://site-malicioso.com` ou `next=//evil.com`): só caminhos internos que começam com `/` são aceitos, e o resto vira `/` → testes em Task 8 (`safeNextPath`).
5. **Busca vazia ou só com espaços** (`/busca?q=` ou `q=%20%20`): mostra "Digite o nome de um filme" e não chama o TMDB → teste em Task 3 (`searchMovies` retorna vazio sem fetch).

---

## File Structure

```
src/
  app/
    layout.tsx                 cabeçalho + rodapé, fontes, tema
    globals.css                tokens de cor (Tailwind 4 @theme)
    page.tsx                   Vitrine
    catalogo/page.tsx
    filme/[id]/page.tsx
    filme/[id]/not-found.tsx
    busca/page.tsx
    favoritos/page.tsx
    entrar/page.tsx
    auth/callback/route.ts     troca code→sessão, redireciona para next
    actions/favorites.ts       Server Actions de favoritos
  components/
    Header.tsx  Footer.tsx  SearchBox.tsx
    PosterCard.tsx  MovieRow.tsx  Hero.tsx  PosterGrid.tsx
    AccessBadge.tsx  WhereToWatch.tsx
    CatalogFilters.tsx          (client; gaveta no celular)
    FavoriteButton.tsx          (client; otimista; conclui favorito pendente)
    Pagination.tsx
  lib/
    format.ts                  formatRating, formatRuntime, releaseYear
    providers.ts               FEATURED_PROVIDERS
    tmdb/client.ts             tmdbFetch, TmdbNotFoundError, imageUrl
    tmdb/types.ts              tipos crus do TMDB + tipos do app
    tmdb/availability.ts       summarizeAvailability, ACCESS_LABELS
    tmdb/movies.ts             funções de dados usadas pelas páginas
    tmdb/catalog.ts            parseCatalogFilters, buildDiscoverParams
    supabase/server.ts  supabase/client.ts  supabase/middleware.ts
    auth.ts                    safeNextPath
  middleware.ts
supabase/migrations/0001_favorites.sql
.github/workflows/supabase-keepalive.yml
.env.example
tests/  (espelha src/, arquivos *.test.ts(x))
```

---

### Task 1: Projeto base, utilitários de formato e layout

**Files:**
- Create: projeto Next em `/home/jessejonas/zcodes/cc-ytb` (o diretório já contém `docs/`), `vitest.config.ts`, `tests/setup.ts`, `.env.example`
- Create: `src/lib/format.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/SearchBox.tsx`
- Test: `tests/lib/format.test.ts`, `tests/components/Footer.test.tsx`

**Interfaces:**
- Produces: `formatRating(voteAverage: number, voteCount: number): string`, `formatRuntime(minutes: number | null): string | null`, `releaseYear(date: string | undefined | null): string | null`; `<Header user={{ name: string; avatarUrl: string | null } | null} />`; `<Footer />`.

- [ ] **Step 1: Conferir Node no WSL.** Run: `node -v`. Expected: `v20.x` ou maior. Se faltar, instalar com `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install --lts` e repetir.
- [ ] **Step 2: Criar o projeto.** `git init` e depois `npx create-next-app@15 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` (aceitar o diretório não vazio). Instalar `npm i server-only` e `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`. `vitest.config.ts`: ambiente `jsdom`, alias `@` → `src`, `setupFiles: ['tests/setup.ts']` (importa `@testing-library/jest-dom/vitest`), e `server-only` mapeado para um módulo vazio nos testes. Script `"test": "vitest run"`. `.env.example` com `TMDB_READ_TOKEN=`, `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Adicionar `.env.local` ao `.gitignore`.
- [ ] **Step 3: Escrever os testes que falham**

```ts
// tests/lib/format.test.ts
expect(formatRating(8.06, 1200)).toBe('8,1')
expect(formatRating(7, 50)).toBe('7,0')
expect(formatRating(0, 0)).toBe('Sem nota')
expect(formatRuntime(125)).toBe('2h 05min')
expect(formatRuntime(45)).toBe('45min')
expect(formatRuntime(null)).toBeNull()
expect(formatRuntime(0)).toBeNull()
expect(releaseYear('2025-03-14')).toBe('2025')
expect(releaseYear('')).toBeNull()
expect(releaseYear(undefined)).toBeNull()
```

```tsx
// tests/components/Footer.test.tsx
render(<Footer />)
expect(screen.getByText(/usa a API do TMDB, mas não é endossado ou certificado pelo TMDB/)).toBeInTheDocument()
expect(screen.getByText(/JustWatch/)).toBeInTheDocument()
```

- [ ] **Step 4: Rodar e ver falhar.** Run: `npm test`. Expected: FAIL (módulos não existem).
- [ ] **Step 5: Implementar** `src/lib/format.ts` e `Footer`. Depois `globals.css` com os tokens das Global Constraints em `@theme` (`--color-bg`, `--color-fg`, `--color-muted`, `--color-panel`, `--color-accent`), `layout.tsx` (`lang="pt-BR"`, Archivo + Inter via `next/font/google`, `<Header user={null} />` por enquanto, `<Footer />`), `Header` (logo "CINE", links Início `/`, Catálogo `/catalogo`, Favoritos `/favoritos`, `SearchBox`, avatar ou link "Entrar" `/entrar`; no celular os links viram uma linha rolável abaixo do logo) e `SearchBox` (form GET para `/busca`, input `name="q"`, placeholder "Buscar filme…").
- [ ] **Step 6: Rodar e ver passar.** Run: `npm test`. Expected: PASS. Run: `npm run build`. Expected: build sem erros.
- [ ] **Step 7: Commit.** `git add -A && git commit -m "feat: projeto base, layout e utilitários de formato"`

---

### Task 2: Chave do TMDB e cliente HTTP

**Files:**
- Create: `src/lib/tmdb/client.ts`, `src/lib/tmdb/types.ts`, `src/lib/providers.ts`
- Modify: `next.config.ts` (`images.remotePatterns` para `https://image.tmdb.org/t/p/**`)
- Test: `tests/lib/tmdb/client.test.ts`

**Interfaces:**
- Produces:
  - `class TmdbNotFoundError extends Error`
  - `tmdbFetch<T>(path: string, params: Record<string, string | number | undefined>, revalidate: number): Promise<T>`: base `https://api.themoviedb.org/3`, header `Authorization: Bearer ${process.env.TMDB_READ_TOKEN}`, sempre adiciona `language=pt-BR`, omite params `undefined`, passa `{ next: { revalidate } }`. Em 404 lança `TmdbNotFoundError`; em outro status não-2xx lança `Error` com o status; sem token lança `Error('TMDB_READ_TOKEN não configurado')`.
  - `imageUrl(path: string | null, size: 'w342' | 'w780' | 'w1280' | 'original'): string | null`
  - `FEATURED_PROVIDERS: { id: number; name: string; rowTitle: string }[]`, na ordem Netflix ("Na Netflix"), Prime Video ("No Prime Video"), Max ("Na Max"), Disney+ ("No Disney+"), Globoplay ("No Globoplay").
  - `types.ts`: `TmdbMovieSummary` (`id, title, overview, poster_path, backdrop_path, release_date, vote_average, vote_count, genre_ids`), `TmdbPaged<T>` (`page, results, total_pages, total_results`), `TmdbProvider` (`provider_id, provider_name, logo_path, display_priority`), `TmdbWatchRegion` (`link?, flatrate?, free?, ads?, rent?, buy?: TmdbProvider[]`), `TmdbMovieDetail` (summary + `runtime, genres, credits{cast,crew}, videos{results}, 'watch/providers'{results: Record<string, TmdbWatchRegion>}, recommendations: TmdbPaged<TmdbMovieSummary>`), `TmdbGenre` (`id, name`).

- [ ] **Step 1: Guiar o usuário para obter a chave (passo do humano, pare e espere).** Mostrar ao usuário, em português:
  1. Criar conta em https://www.themoviedb.org/signup e confirmar o e-mail.
  2. Abrir https://www.themoviedb.org/settings/api → "Criar" → tipo **Developer**, aceitar os termos, uso "pessoal/estudo", e preencher nome do app e URL (pode ser `http://localhost:3000`).
  3. Copiar o **"API Read Access Token"** (o token longo, não a "API Key" curta).
  4. Criar `.env.local` na raiz com `TMDB_READ_TOKEN=<token>`.
  Confirmar com: `curl -s -H "Authorization: Bearer $(grep TMDB_READ_TOKEN .env.local | cut -d= -f2)" "https://api.themoviedb.org/3/watch/providers/movie?watch_region=BR&language=pt-BR" | head -c 300`. Expected: JSON com `"results"`. Conferir os ids de `FEATURED_PROVIDERS` nessa resposta.
- [ ] **Step 2: Escrever os testes que falham** (com `vi.stubGlobal('fetch', vi.fn())` e `process.env.TMDB_READ_TOKEN='t'`)

```ts
// tmdbFetch monta URL, header e cache
await tmdbFetch('/movie/550', { append_to_response: 'credits', page: undefined }, 86400)
const [url, init] = fetchMock.mock.calls[0]
expect(url).toBe('https://api.themoviedb.org/3/movie/550?append_to_response=credits&language=pt-BR')
expect(init.headers.Authorization).toBe('Bearer t')
expect(init.next).toEqual({ revalidate: 86400 })
// 404
fetchMock.mockResolvedValueOnce(new Response('{}', { status: 404 }))
await expect(tmdbFetch('/movie/1', {}, 60)).rejects.toBeInstanceOf(TmdbNotFoundError)
// 500
fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))
await expect(tmdbFetch('/x', {}, 60)).rejects.toThrow('500')
// sem token
delete process.env.TMDB_READ_TOKEN
await expect(tmdbFetch('/x', {}, 60)).rejects.toThrow('TMDB_READ_TOKEN não configurado')
// imageUrl
expect(imageUrl('/a.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/a.jpg')
expect(imageUrl(null, 'w342')).toBeNull()
```

- [ ] **Step 3: Rodar e ver falhar.** Run: `npm test -- tests/lib/tmdb/client.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implementar** `client.ts` (primeira linha `import 'server-only'`), `types.ts`, `providers.ts`, e `remotePatterns` no `next.config.ts`.
- [ ] **Step 5: Rodar e ver passar.** Run: `npm test`. Expected: PASS.
- [ ] **Step 6: Commit.** `git commit -am "feat: cliente TMDB no servidor"` (garantir que `.env.local` NÃO entrou: `git status` não deve listá-lo).

---

### Task 3: Disponibilidade e funções de dados

**Files:**
- Create: `src/lib/tmdb/availability.ts`, `src/lib/tmdb/movies.ts`
- Test: `tests/lib/tmdb/availability.test.ts`, `tests/lib/tmdb/movies.test.ts` (mock de `@/lib/tmdb/client` com `vi.mock`)

**Interfaces:**
- Consumes: `tmdbFetch`, `TmdbNotFoundError`, tipos da Task 2.
- Produces:
  - `type AccessKind = 'flatrate' | 'free' | 'ads' | 'rent' | 'buy'`; `ACCESS_LABELS: Record<AccessKind, string>` (valores das Global Constraints); ordem de exibição `['flatrate','free','ads','rent','buy']`.
  - `type Availability = { available: boolean; link: string | null; kinds: AccessKind[]; groups: { kind: AccessKind; label: string; providers: { id: number; name: string; logoPath: string | null }[] }[] }`
  - `summarizeAvailability(region: TmdbWatchRegion | undefined): Availability`: grupos na ordem acima, só os não vazios, provedores ordenados por `display_priority`; `available = groups.length > 0`.
  - `type MovieCard = { id: number; title: string; posterPath: string | null; backdropPath: string | null; overview: string; year: string | null; rating: string; kinds?: AccessKind[]; providerNames?: string[] }`
  - `toMovieCard(m: TmdbMovieSummary, availability?: Availability): MovieCard`: com `availability`, preenche `kinds` e `providerNames` (nomes únicos, na ordem dos grupos).
  - `getBrProviderIds(): Promise<number[]>`: `/watch/providers/movie` com `watch_region=BR`, revalidate 604800.
  - `getGenres(): Promise<TmdbGenre[]>`: `/genre/movie/list`, revalidate 604800.
  - `getTrendingAvailable(limit = 20): Promise<MovieCard[]>`: `/trending/movie/week` páginas 1 e 2 (revalidate 3600). Para cada filme, `/movie/{id}/watch/providers` (revalidate 3600); mantém só os com `results.BR` disponível, preenche `kinds` e `providerNames` via `toMovieCard(m, summarizeAvailability(results.BR))`, e corta em `limit`.
  - `pickHero(cards: MovieCard[]): MovieCard | null`: o primeiro com `backdropPath`.
  - `getTopRated(): Promise<MovieCard[]>`: `/discover/movie` com `watch_region=BR`, `with_watch_providers=<ids BR unidos por '|'>`, `sort_by=vote_average.desc`, `'vote_count.gte'=300`, revalidate 3600.
  - `getByProvider(providerId: number): Promise<MovieCard[]>`: `/discover/movie` com `watch_region=BR`, `with_watch_providers=providerId`, `sort_by=popularity.desc`, revalidate 3600.
  - `type MovieDetail = MovieCard & { runtime: string | null; genres: string[]; voteCount: number; cast: { name: string; character: string; profilePath: string | null }[]; directors: string[]; trailerUrl: string | null; availability: Availability; recommendations: MovieCard[] }`
  - `getMovieDetail(id: string): Promise<MovieDetail | null>`: retorna `null` se `id` não for inteiro positivo (sem fetch) ou se der `TmdbNotFoundError`. Chama `/movie/{id}` com `append_to_response=credits,videos,watch/providers,recommendations`, revalidate 86400. `cast` = 10 primeiros; `directors` = crew com `job === 'Director'`; `trailerUrl` = primeiro vídeo `site==='YouTube' && type==='Trailer'` → `https://www.youtube.com/watch?v=<key>`; `recommendations` = 20 primeiros do TMDB (filtrar por disponibilidade exigiria uma chamada por filme; o spec diz "quando possível", então não filtrar).
  - `searchMovies(q: string, page: number): Promise<TmdbPaged<MovieCard>>`: com `q.trim()` vazio retorna `{ page: 1, results: [], total_pages: 0, total_results: 0 }` sem fetch; senão `/search/movie` com `query`, `page`, `include_adult=false`, revalidate 21600.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// availability
const a = summarizeAvailability({ link: 'L', rent: [p(2,'Apple TV',5)], flatrate: [p(8,'Netflix',2), p(119,'Prime Video',1)] })
expect(a.available).toBe(true)
expect(a.kinds).toEqual(['flatrate','rent'])
expect(a.groups[0]).toMatchObject({ kind: 'flatrate', label: 'Assinatura' })
expect(a.groups[0].providers.map(x => x.name)).toEqual(['Prime Video','Netflix'])
expect(summarizeAvailability(undefined)).toEqual({ available: false, link: null, kinds: [], groups: [] })
expect(summarizeAvailability({ link: 'L', flatrate: [] }).available).toBe(false)

// movies (tmdbFetch mockado por path)
// getTrendingAvailable: 3 filmes em alta; só 1 e 3 têm BR → retorna ids [1,3] com kinds preenchidos
// pickHero pula o primeiro sem backdrop
expect(pickHero([card({ id: 1, backdropPath: null }), card({ id: 2, backdropPath: '/b.jpg' })])?.id).toBe(2)
expect(pickHero([])).toBeNull()
// getTopRated envia params
expect(params).toMatchObject({ watch_region: 'BR', with_watch_providers: '8|119', sort_by: 'vote_average.desc', 'vote_count.gte': 300 })
expect(params).not.toHaveProperty('with_watch_monetization_types')
// getMovieDetail
expect(await getMovieDetail('abc')).toBeNull(); expect(fetchMock).not.toHaveBeenCalled()
expect(await getMovieDetail('0')).toBeNull()
// mock lança TmdbNotFoundError → null
// detalhe completo: directors ['David Fincher'], trailerUrl 'https://www.youtube.com/watch?v=K', cast.length <= 10, rating '8,4'
// searchMovies
expect(await searchMovies('   ', 1)).toEqual({ page: 1, results: [], total_pages: 0, total_results: 0 }); expect(fetchMock).not.toHaveBeenCalled()
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- tests/lib/tmdb`. Expected: FAIL.
- [ ] **Step 3: Implementar** `availability.ts` e `movies.ts` (`import 'server-only'` no `movies.ts`).
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat: disponibilidade BR e funções de dados do TMDB"`

---

### Task 4: Vitrine (home)

**Files:**
- Create: `src/components/PosterCard.tsx`, `src/components/AccessBadge.tsx`, `src/components/MovieRow.tsx`, `src/components/Hero.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/components/PosterCard.test.tsx`, `tests/components/Hero.test.tsx`

**Interfaces:**
- Consumes: `MovieCard`, `ACCESS_LABELS`, `imageUrl`, `getTrendingAvailable`, `pickHero`, `getTopRated`, `getByProvider`, `FEATURED_PROVIDERS`.
- Produces: `<PosterCard movie={MovieCard} />` (link para `/filme/{id}`, `next/image` w342, nota `★ {rating}`, ano, selo com o primeiro `kinds` quando houver); `<AccessBadge kind={AccessKind} />`; `<MovieRow title={string} movies={MovieCard[]} href?: string />` (rolagem horizontal com `snap-x`; não renderiza nada com lista vazia); `<Hero movie={MovieCard} favoriteSlot?: React.ReactNode />`.

Selos no card: só aparecem onde a forma de acesso já é conhecida sem chamadas extras, ou seja, nos cards de "Em alta". Nas fileiras por serviço e no catálogo, o `/discover` não informa a forma de acesso por filme. Decisão do plano: nesses cards não há selo, e a forma aparece na página do filme.

- [ ] **Step 1: Escrever os testes que falham**

```tsx
render(<PosterCard movie={card({ id: 7, title: 'Duna', posterPath: null, kinds: ['flatrate'], rating: '8,1', year: '2021' })} />)
expect(screen.getByRole('link')).toHaveAttribute('href', '/filme/7')
expect(screen.getByText('Duna')).toBeInTheDocument()       // reserva sem pôster mostra o título
expect(screen.getByText('Assinatura')).toBeInTheDocument()
expect(screen.getByText('★ 8,1')).toBeInTheDocument()
render(<PosterCard movie={card({ kinds: undefined })} />)   // sem selo
expect(screen.queryByText('Assinatura')).toBeNull()
render(<PosterCard movie={card({ rating: '' })} />)          // favorito sem nota gravada
expect(screen.queryByText(/★/)).toBeNull()

render(<Hero movie={card({ title: 'Duna', overview: '', rating: '8,1', year: '2021', providerNames: ['Netflix', 'Max'] })} />)
expect(screen.getByText('#1 EM ALTA NA SEMANA')).toBeInTheDocument()
expect(screen.getByText('2021 · ★ 8,1 · Netflix, Max')).toBeInTheDocument()
expect(screen.queryByText('undefined')).toBeNull()          // sinopse vazia não quebra
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- tests/components`. Expected: FAIL.
- [ ] **Step 3: Implementar os componentes e `page.tsx`.** A página é um Server Component que busca tudo com `Promise.allSettled`. Uma fileira que falhar é omitida e não derruba a página. Ordem: Hero (`pickHero(trending)`; sinopse cortada em ~200 caracteres; linha "{ano} · ★ {rating} · {providerNames.join(', ')}"; botão Favoritar entra na Task 9 via `favoriteSlot`), "Em alta na semana", "Mais bem avaliados no streaming", depois uma fileira por `FEATURED_PROVIDERS` com `href="/catalogo?servicos={id}"` ("ver tudo"). `export const revalidate = 3600`.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test`. Expected: PASS. Run: `npm run dev` e abrir `http://localhost:3000`. Expected: destaque e fileiras com pôsteres reais. Conferir no DevTools (aba Network) que nenhuma requisição do navegador vai para `api.themoviedb.org`.
- [ ] **Step 5: Commit.** `git commit -am "feat: vitrine com destaque e fileiras"`

---

### Task 5: Catálogo com filtros

**Files:**
- Create: `src/lib/tmdb/catalog.ts`, `src/components/PosterGrid.tsx`, `src/components/CatalogFilters.tsx`, `src/components/Pagination.tsx`, `src/app/catalogo/page.tsx`
- Test: `tests/lib/tmdb/catalog.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `getBrProviderIds`, `getGenres`, `toMovieCard`, `PosterCard`.
- Produces:
  - URL do catálogo: `servicos=8,119` (OU), `generos=27,53` (OU), `de=1980`, `ate=1989`, `ordem=popularidade|nota|lancamento`, `pagina=2`.
  - `type CatalogFilters = { providers: number[]; genres: number[]; from: number | null; to: number | null; sort: 'popularidade' | 'nota' | 'lancamento'; page: number }`
  - `parseCatalogFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters`: inteiros positivos apenas; anos entre 1900 e o ano atual + 1, senão `null`; `sort` padrão `'popularidade'`; `page` limitada a 1..500 (padrão 1).
  - `buildDiscoverParams(f: CatalogFilters, allBrProviderIds: number[]): Record<string, string | number>`: `watch_region: 'BR'`; `with_watch_providers` = `f.providers` (ou todos os BR quando vazio) unidos por `'|'`; `with_genres` = gêneros unidos por `'|'` (omitido se vazio); `'primary_release_date.gte': '{from}-01-01'`, `'primary_release_date.lte': '{to}-12-31'`; `sort_by`: popularidade → `popularity.desc`, nota → `vote_average.desc` + `'vote_count.gte': 100`, lancamento → `primary_release_date.desc`; `page`.
  - `discoverCatalog(f: CatalogFilters): Promise<TmdbPaged<MovieCard>>`: revalidate 21600; `total_pages` limitado a 500.
  - `<PosterGrid movies={MovieCard[]} emptyText={string} />`, `<Pagination page={number} totalPages={number} hrefFor={(p: number) => string} />`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
expect(parseCatalogFilters({})).toEqual({ providers: [], genres: [], from: null, to: null, sort: 'popularidade', page: 1 })
expect(parseCatalogFilters({ servicos: '8,abc,119', generos: 'x', de: '3000', ate: '1989', ordem: 'xyz', pagina: '9999' }))
  .toEqual({ providers: [8, 119], genres: [], from: null, to: 1989, sort: 'popularidade', page: 500 })
expect(parseCatalogFilters({ pagina: '0' }).page).toBe(1)
expect(parseCatalogFilters({ pagina: ['3', '4'] }).page).toBe(3)

const p = buildDiscoverParams({ providers: [], genres: [27, 53], from: 1980, to: 1989, sort: 'nota', page: 2 }, [8, 119])
expect(p).toEqual({ watch_region: 'BR', with_watch_providers: '8|119', with_genres: '27|53',
  'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '1989-12-31',
  sort_by: 'vote_average.desc', 'vote_count.gte': 100, page: 2 })
expect(buildDiscoverParams({ ...base, providers: [337] }, [8]).with_watch_providers).toBe('337')
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- tests/lib/tmdb/catalog.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementar.** `catalog.ts`, os componentes e a página. `CatalogFilters` é client: checkboxes de serviço (os 5 em destaque primeiro e depois "mais serviços", recolhido), gêneros, décadas como atalhos que preenchem `de`/`ate` (anos 2020, 2010, 2000, 1990, 1980, 1970 e "Antes de 1970"), select de ordenação. Cada mudança navega com `router.push` para a URL nova com `pagina` reiniciada. No celular (< 768 px), um botão "Filtros" abre uma gaveta lateral. Topo da grade: "{total_results formatado pt-BR} filmes". Vazio: "Nenhum filme encontrado com esses filtros."
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test`. Expected: PASS. No navegador, abrir `/catalogo?servicos=8&generos=27&de=1980&ate=1989`. Expected: filmes de terror dos anos 80 na Netflix, com filtros marcados de acordo com a URL. Abrir `/catalogo?pagina=abc`. Expected: página 1, sem erro.
- [ ] **Step 5: Commit.** `git commit -am "feat: catálogo com filtros na URL"`

---

### Task 6: Página do filme

**Files:**
- Create: `src/components/WhereToWatch.tsx`, `src/app/filme/[id]/page.tsx`, `src/app/filme/[id]/not-found.tsx`
- Test: `tests/components/WhereToWatch.test.tsx`

**Interfaces:**
- Consumes: `getMovieDetail`, `MovieDetail`, `Availability`, `MovieRow`, `imageUrl`.
- Produces: `<WhereToWatch availability={Availability} />`; a página aceita `favoriteSlot` da Task 9 (deixar um `<div data-slot="favorite" />` até lá).

- [ ] **Step 1: Escrever os testes que falham**

```tsx
render(<WhereToWatch availability={summarizeAvailabilityFixture /* flatrate Netflix + rent Apple TV, link 'https://www.themoviedb.org/movie/550/watch?locale=BR' */} />)
expect(screen.getByText('Assinatura')).toBeInTheDocument()
expect(screen.getByText('Aluguel')).toBeInTheDocument()
expect(screen.getByText('Netflix')).toBeInTheDocument()
expect(screen.getByText(/Dados de onde assistir: JustWatch/)).toBeInTheDocument()
expect(screen.getByRole('link', { name: /Ver opções/ })).toHaveAttribute('href', 'https://www.themoviedb.org/movie/550/watch?locale=BR')
render(<WhereToWatch availability={{ available: false, link: null, kinds: [], groups: [] }} />)
expect(screen.getByText('Este filme não está disponível em streaming no Brasil no momento.')).toBeInTheDocument()
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- tests/components/WhereToWatch.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar.** `page.tsx`: `const movie = await getMovieDetail(params.id)`; se `null`, `notFound()`. Layout: fundo com `backdropPath` (w1280, com gradiente escuro; sem backdrop, só a cor do painel), pôster w780, título, ano · duração · gêneros, `★ {rating}` com "({voteCount formatado pt-BR} votos)", direção, sinopse (vazia → "Sinopse indisponível em português."), botão "Ver trailer" (link externo, só se houver `trailerUrl`), `WhereToWatch`, elenco (10, com foto ou iniciais), `MovieRow` "Recomendados". `generateMetadata` com título e sinopse. `export const revalidate = 86400`. `not-found.tsx`: "Filme não encontrado" + link para a Vitrine.
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test`. Expected: PASS. No navegador: `/filme/550` mostra Clube da Luta completo; `/filme/abc` e `/filme/999999999` mostram "Filme não encontrado" com status 404 (`curl -o /dev/null -w "%{http_code}" http://localhost:3000/filme/abc` → `404`).
- [ ] **Step 5: Commit.** `git commit -am "feat: página do filme com onde assistir"`

---

### Task 7: Busca

**Files:**
- Create: `src/app/busca/page.tsx`

**Interfaces:**
- Consumes: `searchMovies`, `PosterGrid`, `Pagination`.

- [ ] **Step 1: Implementar.** Server Component lê `q` e `pagina` (mesma regra de 1..500 da Task 5, reaproveitando o helper de página de `catalog.ts`: exportar `parsePage(v: string | string[] | undefined): number` lá e usar nos dois lugares). `q` vazio → "Digite o nome de um filme". Sem resultados → "Nenhum filme encontrado para “{q}”." Com resultados → título "Resultados para “{q}”", `PosterGrid` e `Pagination`. O `SearchBox` do cabeçalho vem preenchido com `q`.
- [ ] **Step 2: Teste de `parsePage`** em `tests/lib/tmdb/catalog.test.ts`: `parsePage(undefined)` → 1, `'7'` → 7, `'0'` → 1, `'600'` → 500, `'x'` → 1. Run: `npm test`. Expected: PASS.
- [ ] **Step 3: Verificar no navegador.** `/busca?q=matrix`: lista com Matrix; `/busca?q=%20%20`: mensagem "Digite o nome de um filme".
- [ ] **Step 4: Commit.** `git commit -am "feat: busca por título"`

---

### Task 8: Supabase, login com Google e sessão

**Files:**
- Create: `supabase/migrations/0001_favorites.sql`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `src/lib/auth.ts`, `src/app/entrar/page.tsx`, `src/app/auth/callback/route.ts`
- Modify: `src/app/layout.tsx` (passa o usuário real para `Header`)
- Test: `tests/lib/auth.test.ts`

**Interfaces:**
- Produces:
  - `createServerSupabase(): Promise<SupabaseClient>` (usa `cookies()` do `next/headers`), `createBrowserSupabase(): SupabaseClient`, `updateSession(req: NextRequest): Promise<NextResponse>`.
  - `getCurrentUser(): Promise<{ id: string; name: string; avatarUrl: string | null } | null>` em `server.ts` (nome = `user_metadata.full_name` ou e-mail).
  - `safeNextPath(next: string | null | undefined): string`: aceita só valores que começam com `/` e não com `//` ou `/\`; senão `'/'`.
  - Fluxo: `/entrar?next=/filme/550%3Ffav%3D550` → botão "Entrar com Google" chama `signInWithOAuth({ provider: 'google', options: { redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` } })` → `/auth/callback` faz `exchangeCodeForSession(code)` e redireciona para `safeNextPath(next)`. Se falhar, vai para `/entrar?erro=1` ("Não foi possível entrar. Tente de novo.").
  - Tabela `public.favorites`: `user_id uuid not null references auth.users on delete cascade`, `movie_id int not null`, `title text not null`, `poster_path text`, `release_year text`, `created_at timestamptz not null default now()`, `primary key (user_id, movie_id)`; RLS habilitada; políticas `select`, `insert` (with check) e `delete` com `auth.uid() = user_id`; sem política de `update`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
expect(safeNextPath('/filme/550?fav=550')).toBe('/filme/550?fav=550')
expect(safeNextPath('https://evil.com')).toBe('/')
expect(safeNextPath('//evil.com')).toBe('/')
expect(safeNextPath('/\\evil.com')).toBe('/')
expect(safeNextPath('')).toBe('/')
expect(safeNextPath(null)).toBe('/')
```

- [ ] **Step 2: Rodar, falhar, implementar `auth.ts`, rodar, passar.** Run: `npm test -- tests/lib/auth.test.ts`. Expected: FAIL e depois PASS.
- [ ] **Step 3: Guiar o usuário no Supabase (passo do humano, pare e espere).**
  1. Criar conta em https://supabase.com e um projeto novo (região `South America (São Paulo)`, plano Free; guardar a senha do banco).
  2. Em **Project Settings → API**, copiar `Project URL` e a chave `anon public` para o `.env.local` como `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  3. Em **SQL Editor**, colar e rodar o conteúdo de `supabase/migrations/0001_favorites.sql`.
  4. Em **Authentication → URL Configuration**: Site URL `http://localhost:3000`; Redirect URLs `http://localhost:3000/auth/callback`.
- [ ] **Step 4: Guiar o usuário no Google Cloud (passo do humano, pare e espere).**
  1. https://console.cloud.google.com → criar projeto "cine-catalogo".
  2. **APIs e serviços → Tela de consentimento OAuth**: tipo Externo, nome do app, e-mail de suporte; publicar ou adicionar o próprio e-mail como usuário de teste.
  3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**. Em "URIs de redirecionamento autorizados", colar a callback que aparece no Supabase em **Authentication → Providers → Google** (formato `https://<ref>.supabase.co/auth/v1/callback`).
  4. Copiar Client ID e Client Secret para **Supabase → Authentication → Providers → Google** e ativar.
- [ ] **Step 5: Implementar** os clientes Supabase (padrão oficial do `@supabase/ssr` para Next App Router), `middleware.ts` (matcher que exclui `_next/static`, `_next/image`, imagens e `favicon.ico`), `/entrar` (botão "Entrar com Google"; se já logado, redireciona para `next`), `/auth/callback`, e `Header` com avatar + menu "Sair" (Server Action `signOut` que redireciona para `/`).
- [ ] **Step 6: Verificar.** `npm run dev`, clicar "Entrar", logar com Google. Expected: volta para a página de origem com o avatar no cabeçalho. "Sair" volta ao link "Entrar". Abrir `/auth/callback?next=https://evil.com` sem `code`. Expected: cai em `/entrar?erro=1`, nunca em evil.com.
- [ ] **Step 7: Commit.** `git commit -am "feat: login com Google via Supabase"`

---

### Task 9: Favoritos

**Files:**
- Create: `src/app/actions/favorites.ts`, `src/components/FavoriteButton.tsx`, `src/app/favoritos/page.tsx`
- Modify: `src/app/page.tsx` (Hero `favoriteSlot`), `src/app/filme/[id]/page.tsx` (slot)
- Test: `tests/components/FavoriteButton.test.tsx` (mock de `@/app/actions/favorites` e de `next/navigation`)

**Interfaces:**
- Consumes: `createServerSupabase`, `getCurrentUser`, `MovieCard`.
- Produces:
  - `type FavoriteMovie = { movieId: number; title: string; posterPath: string | null; releaseYear: string | null }`
  - `type ActionResult = { ok: true } | { ok: false; error: 'unauthenticated' | 'failed' }`
  - Server Actions: `addFavorite(m: FavoriteMovie): Promise<ActionResult>` (upsert, ignora duplicado), `removeFavorite(movieId: number): Promise<ActionResult>`, ambas chamando `revalidatePath('/favoritos')`.
  - `getFavoriteIds(): Promise<Set<number>>` e `listFavorites(): Promise<MovieCard[]>` (ordem `created_at desc`, montados só com as colunas da tabela, sem chamar o TMDB; `rating: ''` porque a nota não fica gravada, e o `PosterCard` esconde a nota vazia).
  - `<FavoriteButton movie={FavoriteMovie} initialFavorited={boolean} isLoggedIn={boolean} />`

Comportamento do botão:
- Deslogado: ao clicar, navega para `/entrar?next=<caminho atual com ?fav={movieId}>`.
- Logado: inverte o estado na hora (`useOptimistic`/estado local), chama a action e desfaz se vier `ok:false`, mostrando "Não foi possível salvar. Tente de novo."
- Ao montar: se logado, não favoritado e a URL tem `fav={movieId}`, chama `addFavorite` uma vez e remove `fav` da URL com `router.replace`.
- Rótulos: "♡ Favoritar" e "♥ Favoritado", com `aria-pressed`.

- [ ] **Step 1: Escrever os testes que falham**

```tsx
// deslogado → vai para login preservando a página e o favorito pendente
mockPathname('/filme/550'); render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn={false} />)
await user.click(screen.getByRole('button', { name: /Favoritar/ }))
expect(push).toHaveBeenCalledWith('/entrar?next=%2Ffilme%2F550%3Ffav%3D550')
// otimista + sucesso
addFavorite.mockResolvedValue({ ok: true })
render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn />)
await user.click(screen.getByRole('button'))
expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
expect(addFavorite).toHaveBeenCalledWith(m550)
// falha → desfaz
addFavorite.mockResolvedValue({ ok: false, error: 'failed' })
// ...clique → aria-pressed volta a 'false' e aparece 'Não foi possível salvar. Tente de novo.'
// favorito pendente
mockSearchParams('fav=550'); render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn />)
await waitFor(() => expect(addFavorite).toHaveBeenCalledTimes(1))
expect(replace).toHaveBeenCalledWith('/filme/550')
// pendente de outro filme não dispara
mockSearchParams('fav=999'); /* ... */ expect(addFavorite).not.toHaveBeenCalled()
```

- [ ] **Step 2: Rodar e ver falhar.** Run: `npm test -- tests/components/FavoriteButton.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implementar** as actions, o botão, os slots na Vitrine e na página do filme (o servidor passa `initialFavorited` via `getFavoriteIds()` e `isLoggedIn` via `getCurrentUser()`), e `/favoritos`: deslogado redireciona para `/entrar?next=/favoritos`; vazio mostra "Você ainda não favoritou nenhum filme." com link para a Vitrine; senão, `PosterGrid` com título "Meus favoritos ({n})".
- [ ] **Step 4: Rodar e ver passar.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Verificar o fluxo completo.** Deslogado, abrir `/filme/550` e clicar Favoritar. Expected: login Google, volta para `/filme/550` já como "♥ Favoritado", e o filme aparece em `/favoritos`. Abrir em outro navegador com a mesma conta. Expected: o mesmo favorito aparece. No SQL Editor do Supabase, `select * from favorites;` mostra a linha.
- [ ] **Step 6: Commit.** `git commit -am "feat: favoritos sincronizados"`

---

### Task 10: Deploy na Vercel e proteção dos favoritos

**Files:**
- Create: `.github/workflows/supabase-keepalive.yml`, `README.md`

**Interfaces:**
- Consumes: tabela `favorites`, variáveis de ambiente.

- [ ] **Step 1: Escrever o workflow.** Cron diário `0 9 * * *` + `workflow_dispatch`. Job 1 (keep-alive): `curl -fsS "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY"`. Job 2 (backup): instala `postgresql-client`, roda `pg_dump "$SUPABASE_DB_URL" --table=public.favorites --data-only --column-inserts > favorites-$(date +%F).sql` e envia com `actions/upload-artifact@v4` (`retention-days: 30`). Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`.
- [ ] **Step 2: Guiar o usuário no GitHub e na Vercel (passo do humano, pare e espere).**
  1. Criar um repositório no GitHub (privado ok) e fazer `git remote add origin … && git push -u origin main`.
  2. No repositório, **Settings → Secrets and variables → Actions**: criar os 3 secrets. `SUPABASE_DB_URL` vem de **Supabase → Connect → Session pooler** (com a senha do banco).
  3. Em https://vercel.com, **Add New → Project**, importar o repositório e definir `TMDB_READ_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SITE_URL=https://<projeto>.vercel.app`. Fazer o deploy.
  4. No Supabase, **Authentication → URL Configuration**: Site URL `https://<projeto>.vercel.app`, adicionar `https://<projeto>.vercel.app/auth/callback` às Redirect URLs (manter as de localhost).
- [ ] **Step 3: Verificar.** Em **Actions**, rodar o workflow manualmente. Expected: os dois jobs ficam verdes e aparece o artefato `favorites-AAAA-MM-DD.sql`. No site `https://<projeto>.vercel.app`, repetir o fluxo da Task 9 Step 5. Expected: funciona igual. Conferir que `TMDB_READ_TOKEN` não aparece no código do navegador: em DevTools → Sources, buscar pelo começo do token. Expected: nenhum resultado.
- [ ] **Step 4: README** com o que o app faz, como rodar localmente (`.env.example`, comandos no WSL), créditos TMDB/JustWatch e onde ficam os backups.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "chore: deploy, keep-alive e backup dos favoritos" && git push`
