# Filtro por nota mínima — Design

Data: 2026-11-16
Status: aprovado em 2026-11-16

## Intenção

Refinar a busca do site: além de ordenar por nota (já existe), poder **cortar** por nota — "só filmes acima de 7", "só acima de 8". Buscar por nota é um jeito comum de escolher o que assistir.

## Objetivos

- Filtro "Nota mínima" no Catálogo, combinável com serviços, gêneros, década e ordenação.
- Atalho visível na página inicial que leva ao Catálogo já filtrado por nota.

## Não-objetivos

- Filtrar os trilhos da inicial pela nota (o Top 10 deixaria de ser ranking e os trilhos encolheriam).
- Nota máxima ou faixa de notas ("entre 6 e 7").
- Usar a nota do IMDb: a nota é a do TMDB, a mesma já exibida nos pôsteres.

## Anti-objetivos

- Resultados dominados por filmes obscuros com poucos votos e nota inflada (ex.: 9,5 com 3 votos).

## Abordagens consideradas

- **A. Filtro na inicial valendo para todos os trilhos.** Faz o que foi pedido no lugar pedido, mas quebra o Top 10, encolhe ou esvazia trilhos e tira a inicial do cache compartilhado.
- **B. "Nota mínima" só no Catálogo.** Barato e encaixa no padrão atual, mas fica escondido da inicial.
- **C. B + atalho na inicial.** ← **escolhida.** O filtro fica no Catálogo e a inicial ganha chips que levam até ele. A busca por nota fica em evidência sem mexer nos trilhos curados.

## Design

**URL e parsing** ([src/lib/tmdb/catalog.ts](../../../src/lib/tmdb/catalog.ts))
- Novo campo `minRating: number | null` em `CatalogFilters`, no parâmetro `?nota=`.
- Valores aceitos: `6`, `7`, `8`, `9`. Qualquer outro valor é ignorado (vira `null`), como já acontece com os outros filtros.
- `buildCatalogUrl` grava `nota` quando houver valor. `buildDiscoverParams` envia `vote_average.gte=<nota>` e `vote_count.gte=100` (o mesmo piso de votos que a ordenação por nota já usa).

**Painel do Catálogo** ([src/components/CatalogFilters.tsx](../../../src/components/CatalogFilters.tsx))
- Nova seção "Nota mínima" entre "Década" e "Ordenar por", com chips no mesmo estilo dos de década: `6+  7+  8+  9+`. Clicar no chip ativo limpa o filtro.

**Barra de notas na inicial** ([src/app/page.tsx](../../../src/app/page.tsx))
- A inicial é só para exibir, navegar e buscar: a barra **não filtra a inicial**, apenas leva ao Catálogo.
- Barra "Explorar por nota" logo abaixo do destaque, antes do "Top 10 da semana", com chips `6+  7+  8+  9+`; cada um leva para `/catalogo?nota=X&ordem=nota`.
- Substitui os chips pequenos que ficavam ao lado de "Mais bem avaliados no streaming" (revisão de 2026-11-16: passavam despercebidos).

```
[ destaque ]
Explorar por nota   [6+] [7+] [8+] [9+]
Top 10 da semana
┌────┐ ┌────┐ ┌────┐ ...
```

**Testes**
- Estender [tests/lib/tmdb/catalog.test.ts](../../../tests/lib/tmdb/catalog.test.ts): parsing (valores válidos e inválidos), URL de ida e volta e parâmetros do discover.

## Decisões minhas (para conferir)

- 9+ incluído a pedido do usuário, ciente de que com o piso de 100 votos sobram só 3 filmes (contagem de 2026-11-16: 6+ 10.787, 7+ 4.137, 8+ 325, 9+ 3).
- Piso de 100 votos sempre que houver nota mínima.
- Os atalhos da inicial já chegam ordenados por nota.

## Fica a critério de quem implementa

- Texto exato e estilo visual dos chips da inicial, desde que sigam o visual atual.
