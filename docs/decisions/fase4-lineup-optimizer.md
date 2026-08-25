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

## Implementação e validação — 2026-08-25

- Decisão: como o contrato do otimizador retorna IDs, preços e objetivo,
  mas não nomes, a tela hidrata os 12 IDs em paralelo com
  `buscarAtleta()`. Falhas individuais mantêm o card navegável com o ID,
  sem invalidar a escalação ótima já calculada.
- Decisão: os links usam a rota existente `/jogadores/{id}` de
  `DetalheJogador.tsx`; não foi criada uma rota paralela `/atletas/{id}`.
- Decisão: o campo tático é CSS nativo, sem dependência visual nova, com
  linhas semânticas e empilhamento de cards abaixo de 640 px.
- Validação real: backend e Vite locais retornaram uma escalação 4-3-3
  completa para C$ 100, com nomes hidratados e zero erros no console.
