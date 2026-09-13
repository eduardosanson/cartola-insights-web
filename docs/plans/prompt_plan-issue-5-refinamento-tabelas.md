# Prompt Plan: Refinamento de Tabelas, Cards & Ordenação com Nulos por Último (Issue #5)

## Ordem de Implementação

1. [x] Escrever teste em `useMultiSort.test.ts` reproduzindo `null` em ordem ascendente e descendente (accessor que retorna `number | null`) — deve falhar com a implementação atual (que não trata `null`).
2. [x] Implementar em `useMultiSort.ts`: accessor tipado como `(item: T) => number | null`; na comparação, tratar `null` como sempre depois de qualquer valor não-nulo, independente de `criterion.direction` (dois `null` empatam e caem no próximo critério/índice estável).
3. [x] Ajustar `sortAccessors.chance_pontuar_percentual` em `Jogadores.tsx` para retornar `atleta.chance_pontuar_percentual ?? null` (remover o sentinela `-1` e o comentário associado, que descrevia o comportamento incorreto).
4. [x] Estender o teste existente "sorts by chance de pontuar, with atletas sem dado ficando por ultimo" em `Jogadores.test.tsx` para cobrir também a ordem ascendente (segundo clique no header), validando que o `null` continua por último.
5. [x] Aplicar tokens de tipografia em `.chance-badge` (`theme.css`): `font-size: 0.72rem` → `var(--fs-2xs)`, `font-weight: 600` → `var(--fw-semibold)`.
6. [x] Validar que os testes de ordenação de outros campos (`preco_atual`, `media_geral`, `media_basica`, `media_casa`/`media_fora`, `overall_score`) continuam passando sem alteração.
7. [x] Rodar `cartola-insights-web-test` e `cartola-insights-web-build` antes do PR.

## Dependências

- Depende de: tokens de tipografia da issue #4 (`--fs-2xs`, `--fw-semibold`), já em `main`.
- Impacta: `src/hooks/useMultiSort.ts` (tipo de `Accessors`, usado também por `ModalCompararJogador.tsx` e `MatrizCapitao.tsx` — accessors que retornam `number` puro continuam válidos, tipo é covariante).

## Riscos Identificados

- Risco: mudar o tipo do accessor de `useMultiSort` para `number | null` poderia quebrar outros consumidores do hook — mitigado porque `number` é subtipo válido de `number | null` (nenhum accessor existente precisa mudar, exceto o de Chance de Pontuar).
- Risco: tratar `null` na comparação pode afetar a ordem estável entre múltiplos nulos — mitigado tratando dois `null` como empate (`continue` para o próximo critério ou índice original), igual ao comportamento de empate para valores iguais.
