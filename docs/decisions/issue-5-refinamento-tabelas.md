# Log de Decisões — Issue #5 — Refinamento de Tabelas, Cards & Ordenação com Nulos por Último

## DOR → SPEC — 2026-09-13

- Decisão: execução autônoma e não-supervisionada disparada pelo board; sem brainstorming interativo — usar o corpo da issue como insumo completo e registrar suposições aqui em vez de pausar.
- Decisão: tratar a issue como unidade independente de entrega na branch já provisionada pelo workspace (`eduardosanson/5-refinamento-de-tabelas`), escopo restrito ao frontend `cartola-insights-web`.
- Suposição: mapeamento do fluxo de Chance de Pontuar mostrou que o bug já está isolado — `useMultiSort` inverte a diferença numérica para ordem decrescente (`direction === 'asc' ? diff : -diff`), e `Jogadores.tsx` usa o sentinela `atleta.chance_pontuar_percentual ?? -1` para representar "sem dado". Esse sentinela só garante Nulls Last na ordem decrescente (−1 é sempre o menor valor); na ordem crescente ele inverte e os nulos vão para o topo — esse é o bug do RF01. `overall_score` usa o mesmo padrão (`?? -1`) e tem o mesmo bug, mas a issue restringe o escopo explicitamente a Chance de Pontuar (Fora de Escopo: "Aplicar Nulls Last globalmente para todos os campos numéricos") — não será corrigido nesta task.

## SPEC → PROMPT PLAN — 2026-09-13

- Decisão: mover a regra "nulos por último, independente da direção" para dentro do comparador de `useMultiSort` (accessor passa a poder retornar `number | null`; a função de comparação trata `null` como sempre "depois" de qualquer valor não-nulo, sem inverter no caso `desc`) em vez de tentar resolver com um sentinela numérico — nenhum valor sentinela é compatível com as duas direções ao mesmo tempo, então a correção precisa estar na lógica de comparação, não no accessor.
- Decisão: `overall_score` mantém `?? -1` sem alteração (mesmo bug, fora de escopo) — o accessor pode retornar `number | null`, então não há erro de tipo em deixá-lo como está.
- Risco aceito: `overall_score` continua com Nulls Last quebrado em ordem crescente; documentado aqui e no PR para rastreabilidade futura.
- Decisão: ajuste visual (RF03/RF04) fica restrito ao único ponto exclusivo da coluna Chance de Pontuar — `.chance-badge` em `theme.css` — trocando `font-size`/`font-weight` "magic numbers" (0.72rem/600) pelos tokens já existentes (`--fs-2xs`/`--fw-semibold`, que já valem 0.7rem/600) — diferença de 0.02rem é imperceptível (RNF04), zero mudança de layout. Não se mexe em `.player-row .num` nem no header compartilhado por não serem exclusivos desta coluna (evita ampliar o raio de impacto, RNF01).

## PROMPT PLAN → TDD — 2026-09-13

- Decisão: cobrir a regra em `useMultiSort.test.ts` (genérico, sem acoplar ao domínio de Chance de Pontuar) e reforçar em `Jogadores.test.tsx` (ordenação ascendente, que hoje falha) mantendo o teste existente de ordenação descendente.

## TDD → BUILD — 2026-09-13

- Decisão: nenhuma decisão adicional — implementação seguiu o prompt plan sem desvios.
