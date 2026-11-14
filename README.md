# Cine

Catálogo de filmes em português do Brasil. Mostra os filmes em alta, permite explorar o catálogo por gênero e buscar por título, indica em quais serviços de streaming cada filme está disponível no Brasil (assinatura, grátis, com anúncios, aluguel ou compra) e deixa quem entra com a conta Google salvar uma lista de favoritos.

Projeto de estudo, sem fins comerciais.

## Stack

- Next.js 15 (App Router) com React 19 e TypeScript
- Tailwind CSS 4
- TMDB como fonte de dados dos filmes
- Supabase (Auth com Google e Postgres para os favoritos)
- Vitest e Testing Library para os testes
- Vercel para o deploy

## Rodando localmente (WSL)

Pré-requisito: Node.js instalado via [nvm](https://github.com/nvm-sh/nvm).

```bash
nvm install --lts
npm install
cp .env.example .env.local
```

Preencha o `.env.local`:

| Variável | De onde vem |
| --- | --- |
| `TMDB_READ_TOKEN` | Conta no [TMDB](https://www.themoviedb.org) → Settings → API → **API Read Access Token**. Fica só no servidor, nunca use o prefixo `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → chave `anon` (public) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` localmente; a URL da Vercel em produção |

Nunca use a chave `service_role` do Supabase neste projeto.

```bash
npm run dev    # servidor de desenvolvimento em http://localhost:3000
npm test       # testes (Vitest)
npm run lint   # ESLint
```

## Configurando o Supabase

1. Em **SQL Editor**, execute o conteúdo de `supabase/migrations/0001_favorites.sql` para criar a tabela `public.favorites` com suas políticas de acesso (RLS).
2. Em **Authentication → URL Configuration**, defina o Site URL (`http://localhost:3000` para desenvolvimento) e adicione `http://localhost:3000/auth/callback` às Redirect URLs.
3. Em **Authentication → Providers**, habilite o **Google** com o Client ID e o Client Secret criados no Google Cloud Console. Use como URI de redirecionamento autorizado o callback exibido pelo Supabase. O login é apenas Google.

## Deploy na Vercel

> **O repositório no GitHub precisa ser privado.** Os backups gerados pelo workflow (artefato `favorites-backup`) contêm o id de cada usuário e todos os seus favoritos; num repositório público, qualquer pessoa pode baixá-los. Além disso, o GitHub desativa workflows agendados de repositórios públicos depois de 60 dias sem atividade, o que pararia o keep-alive.

1. Em [vercel.com](https://vercel.com), **Add New → Project** e importe o repositório do GitHub.
2. Defina as variáveis de ambiente: `TMDB_READ_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SITE_URL=https://<projeto>.vercel.app`.
3. Faça o deploy.
4. No Supabase, em **Authentication → URL Configuration**, defina o Site URL como `https://<projeto>.vercel.app` e adicione `https://<projeto>.vercel.app/auth/callback` às Redirect URLs, mantendo as de localhost.

## Keep-alive e backup dos favoritos

O workflow `.github/workflows/supabase-keepalive.yml` roda todos os dias às 09:00 UTC (e pode ser disparado manualmente em **Actions → Supabase keep-alive e backup → Run workflow**). Ele tem dois jobs:

- **keepalive**: faz uma requisição à API REST do Supabase para o projeto gratuito não ser pausado por inatividade.
- **backup**: usa `pg_dump` para exportar os dados de `public.favorites` em `favorites-AAAA-MM-DD.sql`.

Os backups ficam em **Actions → execução do workflow → Artifacts** (artefato `favorites-backup`) e são mantidos por 30 dias.

> **Mantenha o repositório privado.** Os artefatos de backup trazem o id e os favoritos de todos os usuários e, em repositórios públicos, podem ser baixados por qualquer pessoa. Em repositórios públicos o GitHub também desativa o agendamento (`schedule`) após 60 dias sem atividade no repositório.

Secrets necessários em **Settings → Secrets and variables → Actions**:

| Secret | Valor |
| --- | --- |
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_ANON_KEY` | chave `anon` do Supabase |
| `SUPABASE_DB_URL` | string de conexão em Supabase → Connect → **Session pooler** (com a senha do banco) |

## Créditos

Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.

Dados de onde assistir: JustWatch.

Projeto de estudo, sem fins comerciais.
