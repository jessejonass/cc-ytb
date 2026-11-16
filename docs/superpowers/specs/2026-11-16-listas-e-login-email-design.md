# Listas "Quero assistir" / "Já assistidos" e login com e-mail — Design

Data: 2026-11-16
Status: aprovado em 2026-11-16

## Intenção

Deixar cada pessoa acompanhar o que quer ver e o que já viu. Hoje o site só tem **Favoritos**. Agora entram dois estados por filme, "Quero assistir" e "Já assisti", e duas abas na inicial para navegar por essas listas. Para usar o recurso é preciso conta, e o login passa a ser por **e-mail e senha**. O Google entra depois, e o código dele já existe.

## Público e contexto

De início, o site será usado pelo dono e por pessoas próximas, mas **o cadastro é aberto**: quando o site for publicado, qualquer pessoa poderá criar a própria conta. Por escolha do usuário, não há confirmação de e-mail. O risco aceito é que alguém pode criar conta com um e-mail que não é seu, mas isso não dá acesso aos dados de mais ninguém, porque o RLS isola cada conta.

Nesta etapa, tudo roda **só localmente** (`http://localhost:3000`). A publicação na Vercel vem depois.

## Estado atual (o que já existe)

- Supabase Auth via `@supabase/ssr`: `src/lib/supabase/{server,client,middleware}.ts`, `src/middleware.ts` e o callback OAuth em `src/app/auth/callback/route.ts`.
- `/entrar` (`src/app/entrar/page.tsx`) tem só o botão do Google (`GoogleSignInButton`), com `?next=` validado por `safeNextPath` (`src/lib/auth.ts`).
- Favoritos: tabela `favorites` com RLS (`supabase/migrations/0001_*`, `0002_*`), as actions `addFavorite`/`removeFavorite` (`src/app/actions/favorites.ts`), a validação `validateFavoriteInput` (`src/lib/favorite-input.ts`), a leitura em `src/lib/favorites.ts`, o `FavoriteButton` (com ação pendente pós-login via `?fav=<id>`) e a página `/favoritos`.
- `Header` mostra avatar ou inicial e "Sair"; `NavLinks` tem Início, Catálogo e Favoritos.
- **O Supabase não está configurado:** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão vazias em `.env.local`. O projeto existe na conta do usuário, mas não tem nada configurado.

## Objetivos

1. Login com e-mail e senha: criar conta, entrar e sair.
2. Marcar um filme como "Quero assistir" ou "Já assisti", com um único estado por filme.
3. Abas **Início · Quero assistir · Já assistidos** no topo da inicial.
4. Configuração do Supabase do zero, guiada passo a passo para o usuário.

## Não-objetivos

- Recuperação de senha ("esqueci minha senha"). Ela exige enviar e-mail, e o envio padrão do Supabase só entrega para a equipe do projeto, até cerca de 2 por hora. Fica para depois, junto com um SMTP próprio (ex.: Resend). Por enquanto, o dono redefine senhas pelo painel do Supabase. Nesta etapa, o site não envia nenhum e-mail.
- Publicar na Vercel. O README já tem a seção de deploy; os passos de produção (variáveis, Site URL e Redirect URLs de produção) ficam para quando o site for publicado.
- Restringir quem pode se cadastrar (lista de e-mails, convites).
- Confirmação de e-mail.
- Login com Google nesta etapa. O botão fica escondido, mas o código permanece.
- Botões de lista nos pôsteres (cards). Nesta etapa eles ficam só na página do filme.
- Mudar os Favoritos.
- Listas públicas ou compartilhadas, notas e resenhas pessoais.

## Anti-objetivos

- Um filme aparecer ao mesmo tempo em "Quero assistir" e "Já assistidos".
- Uma pessoa ver ou alterar a lista de outra.
- Quebrar o fluxo atual de Favoritos ou o comportamento da inicial e do Catálogo.

## Decisões do usuário

- **Três listas.** Favoritos continua como está. "Quero assistir" e "Já assisti" são novos.
- **Estados exclusivos:** marcar "Já assisti" tira o filme de "Quero assistir" e vice-versa. Favoritar é independente desses estados.
- **Abas como na opção A:** uma barra de abas no topo; clicar troca o conteúdo abaixo.
- **Tabela nova** para os estados.
- **Abas implementadas como três endereços** com a mesma barra.
- **Login por e-mail e senha** usando o Supabase Auth, sem confirmação de e-mail.
- **Cadastro aberto:** quem entra no site cria a própria conta.
- **Só local por enquanto;** a Vercel vem depois.

## Abordagens consideradas

**Armazenamento**
- **Tabela nova `watch_status` com coluna `status`.** ← **escolhida.** Uma linha por (pessoa, filme), o que garante a exclusividade pelo próprio formato da tabela. Segue o padrão de `favorites`.
- Duas tabelas, `watchlist` e `watched`: a exclusividade dependeria do código ou de um trigger, e uma falha deixaria o filme nas duas.
- Unificar com `favorites`: mexe no que funciona, sem ganho.

**Abas**
- **Rotas `/`, `/quero-assistir` e `/assistidos` com uma barra de abas comum.** ← **escolhida.** A Início não muda, e as listas não carregam o destaque nem os trilhos.
- `/?aba=…` na própria Início: mistura três páginas num arquivo e obriga a pular as buscas da vitrine condicionalmente.

**Login**
- Supabase Auth com `signInWithPassword` e `signUp`. Era o único caminho sensato, porque o projeto já usa Supabase Auth.

## Design

### Banco de dados (nova migração `supabase/migrations/0003_watch_status.sql`)

```
watch_status
  user_id      uuid  not null  references auth.users on delete cascade
  movie_id     int   not null
  status       text  not null  check (status in ('quero', 'assistido'))
  title        text  not null  (1–300 caracteres)
  poster_path  text            (null ou ≤ 200)
  release_year text            (null ou 4 dígitos)
  updated_at   timestamptz not null default now()
  primary key (user_id, movie_id)
```

- RLS ligado, com políticas de select, insert, update e delete restritas a `auth.uid() = user_id`. Mesmo padrão de `favorites`, mais o `update`, que é necessário para trocar o estado.
- As restrições de tamanho e formato espelham `0002_favorites_limits.sql`.
- Marcar um estado é um `upsert` em `(user_id, movie_id)` com o novo `status` e `updated_at = now()`. Desmarcar é um `delete`.

### Server actions (`src/app/actions/watch-status.ts`)

- `setWatchStatus(movie: FavoriteMovie, status: 'quero' | 'assistido'): Promise<ActionResult>`
- `clearWatchStatus(movieId: number): Promise<ActionResult>`
- Reaproveitam `validateFavoriteInput` (os mesmos campos do filme) e o tipo `ActionResult`. Retornam `unauthenticated` sem sessão e `failed` em erro. Chamam `revalidatePath` em `/quero-assistir` e `/assistidos`.

### Leitura (`src/lib/watch-status.ts`, `server-only`)

- `getWatchStatus(movieId: number): Promise<'quero' | 'assistido' | null>`, usada na página do filme.
- `listByStatus(status): Promise<MovieCard[]>`, ordenada por `updated_at` decrescente (o marcado mais recentemente vem primeiro).
- Sem sessão, ou em caso de erro, retorna vazio ou `null`, como `src/lib/favorites.ts`.

### Botões na página do filme (`src/components/WatchStatusButtons.tsx`, cliente)

Ficam ao lado de "Ver trailer" e "Favoritar", no mesmo estilo `glass` arredondado do `FavoriteButton`:

```
[▶ Ver trailer]  [♡ Favoritar]  [+ Quero assistir]  [✓ Já assisti]
```

- Funcionam como um interruptor: clicar num estado inativo ativa esse e desativa o outro; clicar no estado ativo limpa os dois. Os botões usam `aria-pressed`.
- A atualização é otimista, com reversão e a mensagem "Não foi possível salvar. Tente de novo." em caso de erro, como no `FavoriteButton`.
- **Sem login:** o clique leva a `/entrar?next=<página do filme>?lista=<quero|assistido>` e, na volta, aplica o estado pendente uma única vez (mesmo padrão do `?fav=`).

### Abas da inicial (`src/components/HomeTabs.tsx`)

```
[Início] [Quero assistir] [Já assistidos]
```

- Links para `/`, `/quero-assistir` e `/assistidos`, com `aria-current="page"` na aba ativa.
- Aparecem no topo das três páginas, logo abaixo do header. Na Início, a barra fica sobre o topo do destaque, e o texto do destaque desce o necessário para não colidir.
- O link "Início" do menu do header fica ativo nas três rotas.
- **`/quero-assistir` e `/assistidos`:**
  - Com login: `PosterGrid` com a lista e o título "Quero assistir (N)" ou "Já assistidos (N)". Lista vazia: mensagem no padrão de `/favoritos` ("Você ainda não marcou nenhum filme…") com um botão para o Catálogo.
  - Sem login: a página **não redireciona**. Mostra as abas e um convite: "Entre para montar sua lista", com um botão para `/entrar?next=<rota>`.
  - `dynamic = 'force-dynamic'`, como `/favoritos`.

### Login com e-mail e senha (`/entrar`)

- Dois modos na mesma página, alternados por abas ou um link: **Entrar** e **Criar conta**. Campos: e-mail e senha (mínimo de 8 caracteres).
- Server actions em `src/app/actions/auth.ts`: `signInWithEmail(formData)` e `signUpWithEmail(formData)`, que usam `signInWithPassword` e `signUp`. Com a confirmação desligada, `signUp` já cria a sessão. Em caso de sucesso, redirecionam para `safeNextPath(next)`.
- Mensagens de erro em português, sem revelar se o e-mail existe no login: "E-mail ou senha incorretos." No cadastro: "Este e-mail já tem conta." e "A senha precisa ter pelo menos 8 caracteres."
- O botão do Google fica escondido atrás de uma flag (`NEXT_PUBLIC_GOOGLE_LOGIN=1`), e o código continua no projeto.
- O texto "Entre com sua conta Google para salvar favoritos." muda para algo como "Entre para salvar favoritos e montar suas listas."
- Header: pessoas sem avatar (e-mail) mostram a inicial do e-mail, como já acontece quando falta o avatar.

### Configuração do Supabase (passo guiado no plano)

O plano deve incluir, no momento certo, as instruções para o usuário:
1. Copiar o Project URL e a chave `anon` (Project Settings → API) para `.env.local`. Nunca usar a `service_role`.
2. Rodar as migrações `0001`, `0002` e `0003` no SQL Editor (ou pela CLI).
3. Em Authentication → Providers → Email: deixar o Email ligado, **desligar "Confirm email"** e definir a senha mínima como 8.
4. Em Authentication → URL Configuration: Site URL `http://localhost:3000` e `http://localhost:3000/**` nas Redirect URLs. Quando o site for para a Vercel, o Site URL passa a ser o de produção, e o localhost continua nas Redirect URLs, como o README já descreve.
5. Atualizar o README (seção "Configurando o Supabase"), que hoje diz "O login é apenas Google".

### Backup diário (`.github/workflows/supabase-keepalive.yml`)

- O job de backup, que hoje exporta só `public.favorites`, passa a exportar também `public.watch_status`. Atualizar a seção do README sobre o workflow. *(Decisão minha: as listas são dados do mesmo tipo dos favoritos, e perdê-las seria tão ruim quanto.)*

### Testes

- Unidade: validação da entrada das actions (reaproveitando os testes de `favorite-input`), mapeamento de linhas para `MovieCard` e a lógica do interruptor (estado atual + clique → ação).
- Componentes: `WatchStatusButtons` (interruptor, `aria-pressed`, redirecionamento sem login, reversão em erro), `HomeTabs` (aba ativa) e o formulário de `/entrar` (modos, mensagens de erro).
- Manual, com o Supabase configurado: criar conta, sair, entrar, marcar e trocar estados, conferir as abas e conferir que uma segunda conta não vê a lista da primeira.

## Decisões minhas (para conferir)

- Sem "esqueci minha senha" nesta etapa.
- Botões de lista só na página do filme, não nos pôsteres.
- As abas aparecem para quem não entrou, com convite para entrar (sem redirecionar).
- Favoritos fica fora das abas e continua no menu.
- O link "Início" do menu fica ativo nas três abas.
- As listas são ordenadas pela marcação mais recente.
- O backup diário inclui `watch_status`.

## Fica a critério de quem implementa

- Ícones e texto exato dos botões, desde que sigam o visual atual (`glass`, acento dourado no estado ativo).
- Estilo visual da barra de abas, alinhado ao `NavLinks` e aos chips existentes.
- Como reaproveitar código entre `FavoriteButton` e `WatchStatusButtons` (por exemplo, extrair a lógica de ação pendente pós-login).
