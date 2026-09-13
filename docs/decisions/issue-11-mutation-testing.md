# Log de Decisões — Issue #11 — Mutation Testing no Frontend com Stryker Mutator

## DOR → SPEC — 2026-09-13

- Decisão: execução autônoma disparada pelo board (sem aprovação interativa de checkpoint); ambiguidades do refinamento são resolvidas com a suposição mais razoável e registradas aqui, sem pausar por resposta.
- Decisão: `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` na major mais recente (10.0.0) porque exige apenas `vitest >=2.0.0` (o projeto usa `^4.1.11`) e `node >=22` (ambiente usa Node 24) — sem downgrade de dependências existentes.
- Risco aceito: mutation testing completo do frontend pode ser lento no CI; RNF05 já prevê abrir follow-up de otimização (ex.: `incremental`, sharding) sem afetar o gate bloqueante inicial.

## SPEC → PROMPT PLAN — 2026-09-13

- Decisão: nesta entrega de tooling não há lógica de produto nova para aplicar Red → Green → Refactor; a validação "TDD" desta issue é o próprio ciclo rodar Stryker → ver mutantes sobreviventes → reforçar teste existente → mutante morto, até atingir a meta de 90%.
- Decisão: excluir da mutação apenas arquivos sem lógica executável relevante (`src/main.tsx`, `src/vite-env.d.ts`, `src/setupTests.ts`) e os próprios arquivos de teste — mesmo padrão já usado no `coverage.exclude` do `vitest.config.ts`, evitando dois critérios divergentes de escopo.
- Risco aceito: caso sobrem mutantes genuinamente não-acionáveis (equivalentes), serão documentados como `ignore` pontual no PR, nunca como exclusão de arquivo inteiro, para não mascarar score artificialmente (RNF04).
