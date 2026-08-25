# Log de Decisões — Fase 2 (Novo Ciclo, web): Comparador de Jogadores

## DOR → SPEC — 2026-08-25

- Decisão: spec migrado de `backend/docs/specs/spec-fase2-comparador-jogadores.md`
  para este repositório — a Fase 2 não tem nenhum RF de backend (ver
  decisão de arquitetura abaixo), então o spec fica só onde há
  trabalho real. Histórico e nota de numeração completos preservados
  no cabeçalho do spec.
- Decisão: Pentágono Dual reaproveita `calcularPonto`/anéis/eixos de
  `PentagonoQualidade.tsx` (Fase 1) em vez de recalcular geometria do
  zero — a função já é genérica o suficiente (aceita `total`
  variável).
- Decisão: sem endpoint de agregação no backend — comparador dispara 8
  chamadas em paralelo (`Promise.allSettled`) aos 4 endpoints
  individuais já existentes por atleta. Detalhe completo da decisão em
  `backend/docs/decisions/fase2-comparador-jogadores.md`.

## SPEC → PROMPT PLAN — 2026-08-25

- Decisão: estado de carregamento por atleta usa uma única máquina de
  estados (`carregando | ok | erro-parcial`), não 4 estados
  independentes por atleta (um por endpoint) — reduz a superfície de
  testes de `Comparar.tsx` sem perder o requisito de RNF04 (um atleta
  não trava o outro).
- Decisão: `AtletaAutocomplete.tsx` é um componente novo — não existia
  um autocomplete compartilhado antes desta fase; `Jogadores.tsx` só
  tinha um campo de busca simples sem dropdown de seleção.

