# Catálogo de Filmes em Streaming — Design

Data: 2026-11-14
Status: aprovado em 2026-11-14

> Pré-requisito: o usuário ainda não tem chave da API do TMDB. O plano deve incluir, no momento em que ela for necessária, um passo guiado para criar a conta no TMDB, solicitar a chave (uso pessoal/estudo) e copiar o "API Read Access Token" para `TMDB_READ_TOKEN`. O mesmo vale para os projetos no Supabase e no Google Cloud (OAuth).

## Intenção

Um site para cinéfilos visualizarem os filmes disponíveis hoje nos serviços de streaming, descobrirem o que está em alta, verem recomendações e favoritarem filmes. Os dados vêm da API do TMDB (https://developer.themoviedb.org/docs/getting-started).

As recomendações **não são personalizadas**: são o que está em alta e as recomendações do próprio TMDB por filme. Não há sistema de gosto do usuário.

## Público

Cinéfilos e pessoas procurando o que assistir. Querem descobrir rápido o que está em alta, saber onde assistir e montar uma lista de favoritos que acompanha a pessoa em qualquer aparelho.

## Objetivos

- Mostrar filmes disponíveis em streaming **no Brasil**, com onde assistir.
- Home em formato **Vitrine**: destaque grande + fileiras por tema.
- Página **Catálogo** com filtros (serviço, gênero, ano) e grade de pôsteres.
- Página de filme com detalhes, onde assistir e "recomendados".
- Login e **favoritos sincronizados** entre aparelhos.
- Site responsivo (computador e celular).

## Não-objetivos

- Recomendação personalizada pelo gosto do usuário.
- App nativo (loja de apps).
- Séries de TV (apenas filmes).
- Link direto para o filme dentro do serviço de streaming (a API não fornece).
- Cópia completa do catálogo no nosso banco (abordagem 3; pode vir depois).

## Anti-objetivos (seria fracasso mesmo funcionando)

- Mostrar como "disponível em streaming" um filme que não está em nenhum serviço no Brasil, segundo os dados do TMDB/JustWatch. *Chamada minha*: dados com até 24 h de atraso são aceitáveis, e confiamos no índice do `/discover` como ele vem, sem conferir filme a filme nas listas.
- Chave do TMDB visível no navegador.
- Site lento por chamar o TMDB a cada visita sem cache.
- Perder os favoritos do usuário.

## Restrições

- **TMDB**
  - Dados de streaming são por região e vêm da JustWatch; é **obrigatório** dar crédito à JustWatch onde a informação "onde assistir" aparece. Também é obrigatório o crédito/logo do TMDB.
  - `/discover/movie` retorna no máximo 500 páginas (10.000 resultados) por consulta.
  - Chave gratuita é só para uso não comercial; uso comercial exige licença do TMDB.
- **Hospedagem e dados:** planos gratuitos da Vercel (Hobby) e do Supabase.
- **Uso não comercial:** o projeto é, por ora, para estudo. Sem anúncios, afiliados ou plano pago. Isso mantém válidos a chave gratuita do TMDB e o plano Hobby da Vercel. Se um dia houver receita, será preciso licença comercial do TMDB e plano pago da Vercel.
- **Sem domínio próprio:** o site roda no endereço `*.vercel.app`. Um domínio pode ser configurado no futuro.

## Abordagens consideradas

1. **Next.js na Vercel + Supabase** — escolhida. Chamadas ao TMDB no servidor (chave escondida), cache por página, páginas indexáveis pelo Google, Supabase para login e favoritos. O usuário escolheu porque as rotas de API do Next dispensam um backend separado e a configuração é simples.
2. **React puro (Vite) + Supabase** — descartada: chave exposta no navegador, sem cache, SEO fraco.
3. **Espelhar o catálogo no Supabase com sincronização diária** — adiada: mais trabalho e pode estourar o plano gratuito. Fica como evolução se o limite de 10.000 resultados atrapalhar.

## Decisões do usuário

- Plataforma: site responsivo (proposta aceita).
- Recomendações: em alta + recomendações do TMDB, sem personalização.
- Favoritos: conta própria com **Supabase** (login + banco).
- Stack: **Next.js na Vercel**.
- Projeto de estudo, não comercial; sem domínio próprio, só Vercel.
- Login só com Google por enquanto (consequência de não ter domínio).
- Home: layout **Vitrine** (mockup A em https://claude.ai/artifact/YA83uJqvEqTY9BZPxLdp9S).

## Design

### Páginas

| Rota | Conteúdo |
|---|---|
| `/` Vitrine | Destaque: #1 em alta na semana (disponível em streaming no BR), com sinopse curta, nota, serviços e botão Favoritar. Abaixo, fileiras horizontais: "Em alta na semana", "Mais bem avaliados no streaming" e uma fileira por serviço principal ("Na Netflix", "No Prime Video", "Na Max", "No Disney+", "No Globoplay"). |
| `/catalogo` | Filtros (serviço, gênero, ano/década, ordenação: popularidade, nota, lançamento) + grade de pôsteres paginada. Filtros ficam na URL (compartilháveis). |
| `/filme/[id]` | Pôster, fundo, título, ano, duração, gêneros, nota, sinopse, elenco principal, diretor, trailer (link para YouTube), **onde assistir** (com crédito JustWatch e link para a página JustWatch/TMDB), botão Favoritar, fileira "Recomendados". |
| `/busca?q=` | Resultado de busca por título. |
| `/favoritos` | Grade dos filmes favoritados pelo usuário logado. Exige login. |
| `/entrar` | Login com Google via Supabase Auth. |

Cabeçalho em todas as páginas: logo, Início, Catálogo, Favoritos, campo de busca, avatar/entrar. Rodapé com créditos TMDB e JustWatch.

### Dados do TMDB (todas as chamadas no servidor)

- Região fixa `watch_region=BR`, idioma `language=pt-BR`.
- **Em streaming** = qualquer forma de disponibilidade no BR: assinatura (`flatrate`), grátis (`free`), com anúncios (`ads`), aluguel (`rent`) ou compra (`buy`). Decisão do usuário: o app não separa quem assina de quem não assina. Todas as formas entram nas listas, recomendações e filtros. A forma é só informativa: um selo no card e na página do filme ("Assinatura", "Grátis", "Aluguel", "Compra").
- Em alta: `/trending/movie/week`, filtrado para filmes com algum provedor no BR, de qualquer forma (checar `/movie/{id}/watch/providers`; chamada única por filme, em cache).
- Fileiras por serviço e Catálogo: `/discover/movie` com `with_watch_providers`, `watch_region=BR`, `with_genres`, `primary_release_date.gte/lte`, `sort_by`, sem restringir `with_watch_monetization_types`.
- Página do filme: "onde assistir" lista todos os serviços, agrupados pela forma de acesso.
- **Notas:** somente a nota do TMDB (`vote_average`, 0 a 10, uma casa decimal, ex. ★ 8,1) com o número de votos (`vote_count`) na página do filme. Decisão do usuário: o app usa apenas a API do TMDB, sem IMDb, OMDb ou outras fontes de nota.
- Mais bem avaliados: `/discover/movie` com `sort_by=vote_average.desc` e `vote_count.gte` mínimo (ex. 300) para evitar filmes com poucos votos.
- Detalhe: `/movie/{id}` com `append_to_response=credits,videos,watch/providers,recommendations` (uma chamada só). Recomendados exibidos filtrando os que estão em streaming no BR quando possível.
- Lista de serviços e gêneros: `/watch/providers/movie?watch_region=BR` e `/genre/movie/list`.
- Busca: `/search/movie`. *Chamada minha*: a busca mostra todos os filmes encontrados (para o cinéfilo achar qualquer título); cada resultado leva à página do filme, que diz claramente se está ou não em algum streaming.
- Imagens via `image.tmdb.org` usando `next/image` (domínio configurado).

Cache (Next `fetch` com `revalidate`), *chamada minha*: em alta e fileiras 1 h; catálogo 6 h; detalhe do filme 24 h; listas de gêneros/serviços 7 dias.

Credencial: token de leitura v4 do TMDB em variável de ambiente só do servidor (`TMDB_READ_TOKEN`), nunca com prefixo `NEXT_PUBLIC_`.

### Login e favoritos (Supabase)

- Supabase Auth com **apenas Google OAuth** no lançamento. Sessão via `@supabase/ssr` (cookies), funcionando em Server Components e Route Handlers. Configurar no Google Cloud a tela de consentimento OAuth com as URLs de redirecionamento do Supabase, e no Supabase as URLs do site (`*.vercel.app` de produção e `localhost` para desenvolvimento).
- Login por e-mail (link mágico) fica para quando houver domínio próprio, porque o e-mail embutido do Supabase só entrega para a equipe do projeto e um serviço de envio (ex.: Resend) exige domínio verificado.
- Tabela `favorites`:
  - `user_id uuid` (refs `auth.users`), `movie_id int`, `created_at timestamptz default now()`
  - Chave primária `(user_id, movie_id)`.
  - Guardar também `title`, `poster_path`, `release_year` para montar a grade de favoritos sem chamar o TMDB para cada item.
  - RLS: cada usuário só lê, cria e apaga as próprias linhas.
- Favoritar sem login: o botão leva a `/entrar` e, depois do login, volta à página de origem e conclui o favorito.
- Botão Favoritar com atualização otimista (muda na hora, desfaz se falhar).
- Proteção dos favoritos no plano gratuito, *chamada minha*: o Supabase gratuito pausa o projeto após cerca de uma semana sem uso e tem backups limitados. Um GitHub Action diário faz um ping (mantém o projeto ativo) e exporta a tabela `favorites` com `pg_dump` como artefato. Migrar para o plano Pro fica para quando houver usuários reais em volume.

### Visual

Tema escuro, estilo vitrine de cinema, conforme o mockup A. Responsivo: no celular as fileiras rolam na horizontal com o dedo e os filtros do catálogo abrem numa gaveta.

### Stack (chamada minha onde não especificado)

Next.js (App Router) + TypeScript + Tailwind CSS, hospedado na Vercel; Supabase (Auth + Postgres). Variáveis: `TMDB_READ_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Deixado para quem construir

- Estrutura de pastas e componentes.
- Detalhes visuais finais (tipografia, cores exatas), seguindo o mockup A.
- Estados de carregamento, erro e vazio.
- Estratégia de testes.
- Qual filme de backdrop usar quando faltar imagem.
