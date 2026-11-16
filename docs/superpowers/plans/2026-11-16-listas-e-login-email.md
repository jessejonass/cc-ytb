# Listas e Login com E-mail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Login com e-mail e senha (cadastro aberto, sem confirmação), estados "Quero assistir"/"Já assisti" por filme e abas Início · Quero assistir · Já assistidos.

**Architecture:** Supabase Auth (`signInWithPassword`/`signUp`) via server actions em `/entrar`. Nova tabela `watch_status` (PK `user_id, movie_id`, coluna `status`) com RLS, seguindo o padrão de `favorites`. As abas são três rotas (`/`, `/quero-assistir`, `/assistidos`) com uma barra comum.

**Tech Stack:** Next.js 15 App Router, React 19 (`useActionState`), `@supabase/ssr`, Tailwind 4, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-16-listas-e-login-email-design.md`

## Global Constraints

- Status no banco: exatamente `'quero'` e `'assistido'`. Tipo TS `WatchStatus = 'quero' | 'assistido'`.
- Sem confirmação de e-mail, sem "esqueci minha senha", nenhum e-mail enviado pelo site.
- Senha no cadastro: mínimo de 8 caracteres.
- Favoritos não muda (tabela, actions, `FavoriteButton`, `/favoritos`).
- Botão do Google só aparece com `NEXT_PUBLIC_GOOGLE_LOGIN=1`; o código continua.
- Redirecionamentos pós-login sempre por `safeNextPath` (`src/lib/auth.ts`).
- Textos de UI em português; visual existente (`glass`, acento dourado no ativo, `btn-light`).
- Nunca usar nem pedir a chave `service_role`. Nunca imprimir valores do `.env.local`.
- Testes: `MSYS_NO_PATHCONV=1 wsl.exe -d Ubuntu-26.04 -- /home/jessejonas/zcodes/cc-ytb/.superpowers/run npx vitest run <arquivo>` (ou `npm test`). Git: `git -c safe.directory=*`.
- O usuário tem alterações não commitadas em `src/app/globals.css` e `src/app/layout.tsx`: não tocar nem commitar esses arquivos.

## Review Focus

1. Cadastro com e-mail que já tem conta → "Este e-mail já tem conta.", sem quebrar. (Task 1)
2. E-mail com espaços/maiúsculas (`" Ana@X.com "`) → normalizado para `ana@x.com` antes de chamar o Supabase. (Task 1)
3. `next` malicioso no formulário (`//evil.com`) → redireciona para `/`. (Task 1)
4. Falha ao salvar um estado → os botões voltam ao estado **anterior** (não a "nenhum") e mostram o erro. (Task 3)
5. `?lista=` inválido (`?lista=xyz`) na volta do login → ignorado, nada salvo. (Task 3)

---

### Task 1: Login e cadastro com e-mail e senha

**Files:**
- Create: `src/lib/credentials.ts`, `src/components/EmailAuthForm.tsx`
- Modify: `src/app/actions/auth.ts`, `src/app/entrar/page.tsx`, `.env.example`
- Test: `tests/lib/credentials.test.ts`, `tests/app/auth-actions.test.ts`, `tests/components/EmailAuthForm.test.tsx`

**Interfaces:**
- Produces:
  - `parseCredentials(formData: FormData, mode: 'entrar' | 'criar'): { ok: true; email: string; password: string } | { ok: false; error: string }` (pura, em `src/lib/credentials.ts`).
  - `type AuthFormState = { error: string | null }`.
  - `signInWithEmail(prev: AuthFormState, formData: FormData): Promise<AuthFormState>` e `signUpWithEmail(prev, formData)` em `src/app/actions/auth.ts` (campos do form: `email`, `password`, `next`).
  - `<EmailAuthForm next={string} />` (cliente).

Mensagens exatas:
- E-mail inválido: `Informe um e-mail válido.`
- Senha curta no cadastro: `A senha precisa ter pelo menos 8 caracteres.`
- Senha vazia no login: `Informe sua senha.`
- Login falhou (qualquer erro): `E-mail ou senha incorretos.`
- Cadastro com `error.code === 'user_already_exists'`: `Este e-mail já tem conta.`
- Outro erro no cadastro: `Não foi possível criar a conta. Tente de novo.`
- Supabase não configurado: `Login indisponível: configure o Supabase.`

- [ ] **Step 1: Testes de `parseCredentials`**

```ts
it('normaliza e-mail', () => {
  expect(parseCredentials(fd({ email: ' Ana@X.com ', password: '12345678' }), 'criar'))
    .toEqual({ ok: true, email: 'ana@x.com', password: '12345678' })
})
it('rejeita e-mail inválido', () => {
  for (const email of ['', 'ana', 'ana@', '@x.com', 'a b@x.com'])
    expect(parseCredentials(fd({ email, password: '12345678' }), 'entrar')).toEqual({ ok: false, error: 'Informe um e-mail válido.' })
})
it('cadastro exige 8 caracteres', () => {
  expect(parseCredentials(fd({ email: 'a@x.com', password: '1234567' }), 'criar')).toEqual({ ok: false, error: 'A senha precisa ter pelo menos 8 caracteres.' })
})
it('login aceita senha curta mas não vazia', () => {
  expect(parseCredentials(fd({ email: 'a@x.com', password: '123' }), 'entrar').ok).toBe(true)
  expect(parseCredentials(fd({ email: 'a@x.com', password: '' }), 'entrar')).toEqual({ ok: false, error: 'Informe sua senha.' })
})
```
(`fd` = helper que monta `FormData`. A senha não é aparada.)

- [ ] **Step 2: Testes das actions** (`tests/app/auth-actions.test.ts`)

Mock de `@/lib/supabase/server` (`isSupabaseConfigured: () => true`, `createServerSupabase` devolvendo `{ auth: { signInWithPassword, signUp } }` com `vi.fn()`), e mock de `next/navigation` com `redirect` que lança `new Error('REDIRECT:' + url)`.

```ts
it('login ok redireciona para next seguro', async () => {
  signInWithPassword.mockResolvedValue({ error: null })
  await expect(signInWithEmail({ error: null }, fd({ email: 'A@x.com', password: 'x', next: '/filme/1' }))).rejects.toThrow('REDIRECT:/filme/1')
  expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@x.com', password: 'x' })
})
it('next malicioso vai para /', async () => {
  signInWithPassword.mockResolvedValue({ error: null })
  await expect(signInWithEmail({ error: null }, fd({ email: 'a@x.com', password: 'x', next: '//evil.com' }))).rejects.toThrow('REDIRECT:/')
})
it('login inválido', async () => {
  signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } })
  expect(await signInWithEmail({ error: null }, fd({ email: 'a@x.com', password: 'x' }))).toEqual({ error: 'E-mail ou senha incorretos.' })
})
it('cadastro com e-mail existente', async () => {
  signUp.mockResolvedValue({ data: {}, error: { code: 'user_already_exists' } })
  expect(await signUpWithEmail({ error: null }, fd({ email: 'a@x.com', password: '12345678' }))).toEqual({ error: 'Este e-mail já tem conta.' })
})
it('cadastro ok redireciona', async () => {
  signUp.mockResolvedValue({ data: { session: {} }, error: null })
  await expect(signUpWithEmail({ error: null }, fd({ email: 'a@x.com', password: '12345678', next: '/' }))).rejects.toThrow('REDIRECT:/')
})
it('validação falha não chama o Supabase', async () => {
  expect(await signUpWithEmail({ error: null }, fd({ email: 'a@x.com', password: '1' }))).toEqual({ error: 'A senha precisa ter pelo menos 8 caracteres.' })
  expect(signUp).not.toHaveBeenCalled()
})
```

- [ ] **Step 3: Testes do formulário** (`tests/components/EmailAuthForm.test.tsx`; mock de `@/app/actions/auth`)

- Começa no modo "Entrar": `getByRole('button', { name: 'Entrar' })` com `type="submit"`, campos `E-mail` e `Senha` (por label), campo oculto `next`.
- Clicar em "Criar conta" (alternador) troca o botão de envio para "Criar conta" e a senha ganha `minLength={8}` e `autoComplete="new-password"` (no login, `current-password`).
- Quando a action devolve `{ error: 'E-mail ou senha incorretos.' }`, o texto aparece num `role="alert"`.

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run tests/lib/credentials.test.ts tests/app/auth-actions.test.ts tests/components/EmailAuthForm.test.tsx`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 5: Implementar**

- `parseCredentials`: e-mail `trim().toLowerCase()` e `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- Actions: `'use server'` no arquivo existente (manter `signOut`). Fluxo: Supabase não configurado → mensagem; `parseCredentials`; chamada; `redirect(safeNextPath(formData.get('next')))` **fora** de try/catch.
- `EmailAuthForm`: `useActionState` com a action do modo atual. O alternador Entrar/Criar conta é um par de botões `type="button"` com `aria-pressed`. Envio desabilitado enquanto `pending`.
- `/entrar`: substituir o botão do Google por `<EmailAuthForm next={next} />`. Abaixo, só com `process.env.NEXT_PUBLIC_GOOGLE_LOGIN === '1'`, um divisor "ou" e `<GoogleSignInButton next={next} />`. Subtítulo: `Entre para salvar favoritos e montar suas listas.` Manter o alerta `?erro` e o fallback de Supabase não configurado.
- `.env.example`: adicionar `NEXT_PUBLIC_GOOGLE_LOGIN=`.

- [ ] **Step 6: Rodar e ver passar**, depois `npx tsc --noEmit`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/credentials.ts src/components/EmailAuthForm.tsx src/app/actions/auth.ts src/app/entrar/page.tsx .env.example tests/lib/credentials.test.ts tests/app/auth-actions.test.ts tests/components/EmailAuthForm.test.tsx
git commit -m "feat(auth): login e cadastro com e-mail e senha"
```

---

### Task 2: Tabela `watch_status`, actions e leitura

**Files:**
- Create: `supabase/migrations/0003_watch_status.sql`, `src/lib/watch-status-input.ts`, `src/app/actions/watch-status.ts`, `src/lib/watch-status.ts`
- Test: `tests/lib/watch-status-input.test.ts`, `tests/app/watch-status-actions.test.ts`

**Interfaces:**
- Consumes: `validateFavoriteInput`, `FavoriteMovie` (`src/lib/favorite-input.ts`), `ActionResult` (`src/app/actions/favorites.ts`; exportar daí se preciso).
- Produces:
  - `src/lib/watch-status-input.ts` (pura, usável no cliente): `type WatchStatus = 'quero' | 'assistido'`; `WATCH_STATUSES: readonly WatchStatus[]`; `isWatchStatus(v: unknown): v is WatchStatus`; `nextWatchAction(current: WatchStatus | null, clicked: WatchStatus): { kind: 'set'; status: WatchStatus } | { kind: 'clear' }`.
  - `setWatchStatus(movie: FavoriteMovie, status: WatchStatus): Promise<ActionResult>` e `clearWatchStatus(movieId: number): Promise<ActionResult>` em `src/app/actions/watch-status.ts`.
  - `getWatchStatus(movieId: number): Promise<WatchStatus | null>` e `listByStatus(status: WatchStatus): Promise<MovieCard[]>` em `src/lib/watch-status.ts` (`server-only`).

- [ ] **Step 1: Testes puros**

```ts
it('isWatchStatus', () => {
  expect(isWatchStatus('quero')).toBe(true); expect(isWatchStatus('assistido')).toBe(true)
  for (const v of ['xyz', '', null, undefined, 1, 'QUERO']) expect(isWatchStatus(v)).toBe(false)
})
it('nextWatchAction', () => {
  expect(nextWatchAction(null, 'quero')).toEqual({ kind: 'set', status: 'quero' })
  expect(nextWatchAction('quero', 'assistido')).toEqual({ kind: 'set', status: 'assistido' })
  expect(nextWatchAction('assistido', 'assistido')).toEqual({ kind: 'clear' })
})
```

- [ ] **Step 2: Testes das actions** (mocks como em Task 1; `createServerSupabase` com `auth.getUser` e `from()` encadeável; mock de `next/cache`)

- Sem usuário → `{ ok: false, error: 'unauthenticated' }` nas duas actions.
- `setWatchStatus` com status inválido (`'xyz' as WatchStatus`) ou filme inválido (`movieId: 0`) → `{ ok: false, error: 'failed' }`, sem chamar `from`.
- `setWatchStatus` ok chama `from('watch_status').upsert({ user_id, movie_id, status, title, poster_path, release_year, updated_at: expect.any(String) }, { onConflict: 'user_id,movie_id' })` e devolve `{ ok: true }`; `revalidatePath` chamado com `/quero-assistir` e `/assistidos`.
- `clearWatchStatus(550)` faz `delete().eq('user_id', id).eq('movie_id', 550)`; `clearWatchStatus(-1)` → `failed`.
- Erro do Supabase → `failed`.

- [ ] **Step 3: Rodar e ver falhar.**

- [ ] **Step 4: Implementar**

- Migração `0003_watch_status.sql`: a tabela do spec, `enable row level security`, políticas `watch_status_{select,insert,update,delete}_own` com `auth.uid() = user_id` (`update` com `using` e `with check`), constraints de tamanho e formato iguais às de `0002`, e `check (status in ('quero','assistido'))`.
- Actions no padrão de `src/app/actions/favorites.ts` (`currentSession()`, validação antes de qualquer chamada).
- `listByStatus`: `select('movie_id,title,poster_path,release_year').eq('status', status).order('updated_at', { ascending: false })`, mapeando para `MovieCard` como em `listFavorites`. As duas leituras retornam vazio ou `null` sem sessão ou em erro (com `unstable_rethrow`).

- [ ] **Step 5: Rodar e ver passar**, depois `npx tsc --noEmit`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0003_watch_status.sql src/lib/watch-status-input.ts src/lib/watch-status.ts src/app/actions/watch-status.ts tests/lib/watch-status-input.test.ts tests/app/watch-status-actions.test.ts
git commit -m "feat(listas): tabela watch_status com RLS, actions e leitura"
```

---

### Task 3: Botões "Quero assistir" / "Já assisti" na página do filme

**Files:**
- Create: `src/components/WatchStatusButtons.tsx`
- Modify: `src/app/filme/[id]/page.tsx`, `tests/app/filme-page.test.tsx` (mock novo)
- Test: `tests/components/WatchStatusButtons.test.tsx`

**Interfaces:**
- Consumes: `WatchStatus`, `isWatchStatus`, `nextWatchAction`, `setWatchStatus`, `clearWatchStatus`, `getWatchStatus` (Task 2).
- Produces: `<WatchStatusButtons movie={FavoriteMovie} initialStatus={WatchStatus | null} isLoggedIn={boolean} />`.

Rótulos: botões `Quero assistir` (ícone `+`) e `Já assisti` (ícone `✓`), os dois com `aria-pressed`. Erro: `Não foi possível salvar. Tente de novo.` Parâmetro pendente: `lista`.

- [ ] **Step 1: Testes** (mocks de `next/navigation` e `@/app/actions/watch-status` no padrão de `tests/components/FavoriteButton.test.tsx`)

```ts
it('deslogado vai para o login com o estado pendente', () => {
  render(<WatchStatusButtons movie={m550} initialStatus={null} isLoggedIn={false} />)
  fireEvent.click(screen.getByRole('button', { name: /Já assisti/ }))
  expect(nav.push).toHaveBeenCalledWith(`/entrar?next=${encodeURIComponent('/filme/550?lista=assistido')}`)
})
it('trocar de quero para assistido', async () => {
  actions.setWatchStatus.mockResolvedValue({ ok: true })
  render(<WatchStatusButtons movie={m550} initialStatus="quero" isLoggedIn />)
  fireEvent.click(screen.getByRole('button', { name: /Já assisti/ }))
  expect(screen.getByRole('button', { name: /Já assisti/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /Quero assistir/ })).toHaveAttribute('aria-pressed', 'false')
  await waitFor(() => expect(actions.setWatchStatus).toHaveBeenCalledWith(m550, 'assistido'))
})
it('clicar no ativo limpa', async () => {
  actions.clearWatchStatus.mockResolvedValue({ ok: true })
  render(<WatchStatusButtons movie={m550} initialStatus="quero" isLoggedIn />)
  fireEvent.click(screen.getByRole('button', { name: /Quero assistir/ }))
  await waitFor(() => expect(actions.clearWatchStatus).toHaveBeenCalledWith(550))
  expect(screen.getByRole('button', { name: /Quero assistir/ })).toHaveAttribute('aria-pressed', 'false')
})
it('falha volta ao estado anterior', async () => {
  actions.setWatchStatus.mockResolvedValue({ ok: false, error: 'failed' })
  render(<WatchStatusButtons movie={m550} initialStatus="quero" isLoggedIn />)
  fireEvent.click(screen.getByRole('button', { name: /Já assisti/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar. Tente de novo.')
  expect(screen.getByRole('button', { name: /Quero assistir/ })).toHaveAttribute('aria-pressed', 'true')
})
it('aplica ?lista= pendente uma vez e limpa a URL', async () => {
  setUrl('/filme/550?lista=quero'); actions.setWatchStatus.mockResolvedValue({ ok: true })
  render(<WatchStatusButtons movie={m550} initialStatus={null} isLoggedIn />)
  await waitFor(() => expect(actions.setWatchStatus).toHaveBeenCalledWith(m550, 'quero'))
  expect(nav.replace).toHaveBeenCalledWith('/filme/550')
})
it('ignora ?lista= inválido', () => {
  setUrl('/filme/550?lista=xyz')
  render(<WatchStatusButtons movie={m550} initialStatus={null} isLoggedIn />)
  expect(actions.setWatchStatus).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar**

- Mesmo estilo e tamanho `lg` do `FavoriteButton`; o ativo ganha `!border-accent/70 text-accent`.
- O efeito do pendente só roda se `isLoggedIn`, `isWatchStatus(lista)` e `initialStatus !== lista`; depois remove só o `lista` da URL com `router.replace`.
- Na página do filme, buscar `getWatchStatus(movie.id)` no mesmo `Promise.all` de `getCurrentUser`/`getFavoriteIds` e renderizar `<WatchStatusButtons … />` logo após o `FavoriteButton`.
- Em `tests/app/filme-page.test.tsx`, adicionar `vi.mock('@/lib/watch-status', () => ({ getWatchStatus: async () => null }))` e `vi.mock('@/app/actions/watch-status', …)`.

- [ ] **Step 4: Rodar a suíte inteira** (`npm test`) e `npx tsc --noEmit`: tudo passa.

- [ ] **Step 5: Commit**

```bash
git add src/components/WatchStatusButtons.tsx "src/app/filme/[id]/page.tsx" tests/components/WatchStatusButtons.test.tsx tests/app/filme-page.test.tsx
git commit -m "feat(listas): botões quero assistir e já assisti na página do filme"
```

---

### Task 4: Abas da inicial e páginas das listas

**Files:**
- Create: `src/lib/home-tabs.ts`, `src/components/HomeTabs.tsx`, `src/components/WatchListPage.tsx`, `src/app/quero-assistir/page.tsx`, `src/app/assistidos/page.tsx`
- Modify: `src/app/page.tsx`, `src/components/Hero.tsx` (padding do topo), `src/components/NavLinks.tsx`
- Test: `tests/components/HomeTabs.test.tsx`, `tests/components/WatchListPage.test.tsx`

**Interfaces:**
- Consumes: `listByStatus`, `WatchStatus` (Task 2); `getCurrentUser`; `PosterGrid`, `PageHeader`.
- Produces:
  - `src/lib/home-tabs.ts`: `HOME_TABS = [{ key: 'inicio', href: '/', label: 'Início' }, { key: 'quero', href: '/quero-assistir', label: 'Quero assistir' }, { key: 'assistido', href: '/assistidos', label: 'Já assistidos' }] as const`; `type HomeTabKey`; `isHomeTabPath(pathname: string | null): boolean`.
  - `<HomeTabs active={HomeTabKey} />` (servidor, `<nav aria-label="Abas da inicial">`).
  - `<WatchListPage status={WatchStatus} />` (servidor, assíncrono).

Textos exatos:
- Títulos: `Quero assistir (N)` e `Já assistidos (N)`. Vazio: o título sem número e `Você ainda não marcou nenhum filme como quero assistir.` / `Você ainda não marcou nenhum filme como assistido.`, com o botão `Explorar o catálogo` → `/catalogo`.
- Sem login: `Entre para montar sua lista` e o botão `Entrar` → `/entrar?next=/quero-assistir` (ou `/assistidos`).

- [ ] **Step 1: Testes**

- `HomeTabs`: 3 links com hrefs `/`, `/quero-assistir`, `/assistidos`; só o `active` tem `aria-current="page"`.
- `isHomeTabPath`: true para `/`, `/quero-assistir` e `/assistidos`; false para `/catalogo`, `/assistidos-x` e `null`.
- `WatchListPage` (mocks de `@/lib/watch-status` e `@/lib/supabase/server`; renderizar com `render(await WatchListPage({ status: 'quero' }))`):
  - sem usuário: texto "Entre para montar sua lista", link `Entrar` com href `/entrar?next=/quero-assistir`, e `listByStatus` não chamado;
  - com usuário e lista vazia: a mensagem de vazio e o link para `/catalogo`;
  - com 2 filmes: heading `Já assistidos (2)` para `status: 'assistido'`, com os 2 títulos.

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar**

- `WatchListPage` renderiza `<HomeTabs active=… />` no topo, seguido do conteúdo (layout igual ao de `/favoritos`). As páginas `quero-assistir` e `assistidos` exportam `dynamic = 'force-dynamic'`, `metadata` com o título da aba e `return <WatchListPage status=… />`.
- Na Início, renderizar `<HomeTabs active="inicio" />` num contêiner `absolute inset-x-0 top-(--header-h) z-20` sobre o destaque, dentro de um wrapper `relative`. No `Hero`, aumentar o padding do topo do texto pela altura da barra (de `pt-[calc(var(--header-h)+1.5rem)]` para cerca de `+4.5rem`). Sem destaque (`heroes.length === 0`), a barra fica no fluxo normal.
- `NavLinks`: o item `Início` fica ativo quando `isHomeTabPath(pathname)`.

- [ ] **Step 4: `npm test`, `npx tsc --noEmit` e `npm run lint`: tudo passa.**

- [ ] **Step 5: Conferir no app** (`curl` local): `/` contém a nav "Abas da inicial"; `/quero-assistir` sem login mostra "Entre para montar sua lista" com status 200 (sem redirecionar).

- [ ] **Step 6: Commit**

```bash
git add src/lib/home-tabs.ts src/components/HomeTabs.tsx src/components/WatchListPage.tsx src/app/quero-assistir src/app/assistidos src/app/page.tsx src/components/Hero.tsx src/components/NavLinks.tsx tests/components/HomeTabs.test.tsx tests/components/WatchListPage.test.tsx
git commit -m "feat(listas): abas da inicial e páginas quero assistir e já assistidos"
```

---

### Task 5: Configuração do Supabase, backup, README e teste de ponta a ponta

**Files:**
- Modify: `.github/workflows/supabase-keepalive.yml`, `README.md`

- [ ] **Step 1: Backup.** No job de backup, gerar o dump com `--table=public.favorites --table=public.watch_status` num arquivo `backup-$(date +%F).sql`, com artifact `supabase-backup` e `path: backup-*.sql`. Atualizar a seção do workflow no README.

- [ ] **Step 2: README, "Configurando o Supabase".** Trocar "O login é apenas Google" pelos passos do spec: chaves no `.env.local`; rodar `0001`→`0003` no SQL Editor; Email provider ligado com "Confirm email" desligado e senha mínima 8; Site URL `http://localhost:3000` e Redirect URL `http://localhost:3000/**`. O Google vira um passo opcional (`NEXT_PUBLIC_GOOGLE_LOGIN=1`). Anotar que "esqueci minha senha" depende de SMTP próprio (fica para depois).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/supabase-keepalive.yml README.md
git commit -m "docs: configuração do Supabase com e-mail e backup das listas"
```

- [ ] **Step 4: PARAR e guiar o usuário pela configuração** (é ação dele; ele mesmo cola as chaves no `.env.local`). Passo a passo em português, um passo por vez, conforme o README, conferindo cada um:
  1. Project Settings → API: copiar o Project URL e a chave `anon` para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  2. SQL Editor: rodar `0001_favorites.sql`, `0002_favorites_limits.sql` e `0003_watch_status.sql`, nessa ordem.
  3. Authentication → Sign In / Providers → Email: ligado; "Confirm email" desligado; senha mínima 8.
  4. Authentication → URL Configuration: Site URL e Redirect URLs (localhost).
  5. Reiniciar o `npm run dev`.

  Verificar sem imprimir segredos: `awk -F= '{print $1": "length($2)}' .env.local` mostra as duas chaves com tamanho > 0.

- [ ] **Step 5: Teste de ponta a ponta com o usuário** (no navegador dele): criar a conta A → marcar um filme "Quero assistir" → trocar para "Já assisti" → conferir as abas → sair → criar a conta B → as abas de B aparecem vazias. Registrar o resultado.
