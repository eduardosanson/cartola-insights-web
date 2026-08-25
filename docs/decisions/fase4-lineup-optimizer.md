# Log de Decisões — Fase 4 (Novo Ciclo, web): Lineup Optimizer

## DOR → SPEC — 2026-08-25

- Decisão: esquemas táticos vêm de `GET /otimizador/esquemas`, não
  hardcoded no cliente — evita duplicar a lista de 6 esquemas e
  divergir do backend se um esquema for ajustado.
- Decisão: rótulo de `pontuacao_esperada` varia por modo (RF03) — cada
  modo maximiza uma coisa diferente (piso/teto/margem sobre MPV) e
  mostrar o mesmo rótulo genérico pros 3 confundiria o usuário sobre o
  que está vendo.

## SPEC → PROMPT PLAN — 2026-08-25

- Decisão: erro `422` do backend (orçamento inviável) vira um erro
  tipado no cliente (`src/api/otimizador.ts`), não tratado como falha
  de rede genérica — a UI depende de distinguir esse caso pra mostrar
  RF05 corretamente.
