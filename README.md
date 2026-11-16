# Cine

Catálogo de filmes em português do Brasil. Mostra os filmes em alta, permite explorar o catálogo por gênero e buscar por título, indica em quais serviços de streaming cada filme está disponível no Brasil (assinatura, grátis, com anúncios, aluguel ou compra) e deixa quem cria uma conta (e-mail e senha) salvar favoritos e marcar filmes como "Quero assistir" ou "Já assisti", com abas na inicial para navegar por essas listas.

Projeto de estudo, sem fins comerciais.

## Stack

- Next.js 15 (App Router) com React 19 e TypeScript
- Tailwind CSS 4
- TMDB como fonte de dados dos filmes
- Supabase (Auth com e-mail e senha, Google opcional, e Postgres para favoritos e listas)
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
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → **Publishable key** (`sb_publishable_...`). Projetos antigos podem usar a chave `anon` em `NEXT_PUBLIC_SUPABASE_ANON_KEY`; o código aceita as duas |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` localmente; a URL da Vercel em produção |
| `NEXT_PUBLIC_GOOGLE_LOGIN` | Opcional. `1` mostra o botão "Entrar com Google" (exige o passo 5 abaixo); vazio esconde |

Nunca use a chave `service_role` nem a **Secret key** (`sb_secret_...`) do Supabase neste projeto.

```bash
npm run dev    # servidor de desenvolvimento em http://localhost:3000
npm test       # testes (Vitest)
npm run lint   # ESLint
```

## Configurando o Supabase

1. Em **Project Settings**, copie o Project URL e a **Publishable key** para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no `.env.local`.
2. Em **SQL Editor**, execute, nesta ordem:
   - `supabase/migrations/0001_favorites.sql`: tabela `public.favorites` com políticas de acesso (RLS);
   - `supabase/migrations/0002_favorites_limits.sql`: limites de tamanho e formato (título, pôster e ano);
   - `supabase/migrations/0003_watch_status.sql`: tabela `public.watch_status` ("Quero assistir"/"Já assisti") com RLS.
3. Em **Authentication → Sign In / Providers → Email**: deixe o Email ligado, **desligue "Confirm email"** e defina a senha mínima em 8 caracteres. Com a confirmação desligada, a conta funciona assim que é criada e o site não envia e-mails.
4. Em **Authentication → URL Configuration**, defina o Site URL (`http://localhost:3000` para desenvolvimento) e adicione `http://localhost:3000/**` às Redirect URLs.
5. *(Opcional)* Para o login com Google: em **Authentication → Providers**, habilite o **Google** com o Client ID e o Client Secret criados no Google Cloud Console (URI de redirecionamento autorizado: o callback exibido pelo Supabase) e defina `NEXT_PUBLIC_GOOGLE_LOGIN=1`.

O cadastro é aberto: qualquer pessoa que acessar o site pode criar uma conta. Cada conta só vê e altera as próprias listas (RLS).

**Recuperação de senha:** ainda não existe. O envio padrão de e-mails do Supabase só entrega para os membros da equipe do projeto (cerca de 2 por hora), então "esqueci minha senha" depende de configurar um SMTP próprio (ex.: Resend) em **Authentication → Emails → SMTP Settings**. Até lá, redefina senhas pelo painel em **Authentication → Users**.

## Deploy na Vercel

> **O repositório no GitHub precisa ser privado.** Os backups gerados pelo workflow (artefato `supabase-backup`) contêm o id de cada usuário, seus favoritos e suas listas; num repositório público, qualquer pessoa pode baixá-los. Além disso, o GitHub desativa workflows agendados de repositórios públicos depois de 60 dias sem atividade, o que pararia o keep-alive.

1. Em [vercel.com](https://vercel.com), **Add New → Project** e importe o repositório do GitHub.
2. Defina as variáveis de ambiente: `TMDB_READ_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL=https://<projeto>.vercel.app`.
3. Faça o deploy.
4. No Supabase, em **Authentication → URL Configuration**, defina o Site URL como `https://<projeto>.vercel.app` e adicione `https://<projeto>.vercel.app/**` às Redirect URLs, mantendo `http://localhost:3000/**`.

## Keep-alive e backup dos dados

O workflow `.github/workflows/supabase-keepalive.yml` roda todos os dias às 09:00 UTC (e pode ser disparado manualmente em **Actions → Supabase keep-alive e backup → Run workflow**). Ele tem dois jobs:

- **keepalive**: faz uma requisição ao health check do Supabase Auth (`/auth/v1/health`, com timeout de 30 s) para o projeto gratuito não ser pausado por inatividade.
- **backup**: usa `pg_dump` para exportar os dados de `public.favorites` e `public.watch_status` em `backup-AAAA-MM-DD.sql`.

Os backups ficam em **Actions → execução do workflow → Artifacts** (artefato `supabase-backup`) e são mantidos por 30 dias.

> **Mantenha o repositório privado.** Os artefatos de backup trazem o id, os favoritos e as listas de todos os usuários e, em repositórios públicos, podem ser baixados por qualquer pessoa. Em repositórios públicos o GitHub também desativa o agendamento (`schedule`) após 60 dias sem atividade no repositório.

Secrets necessários em **Settings → Secrets and variables → Actions**:

| Secret | Valor |
| --- | --- |
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_ANON_KEY` | Publishable key (ou a chave `anon`) do Supabase |
| `SUPABASE_DB_URL` | string de conexão em Supabase → Connect → **Session pooler** (com a senha do banco) |

## Créditos

Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.

Dados de onde assistir: JustWatch.

Projeto de estudo, sem fins comerciais.
