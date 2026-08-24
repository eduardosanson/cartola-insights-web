# Log de Decisões — Fase 7 (média básica, web)

## TDD → EVIDÊNCIAS — 2026-08-24

- Decisão: coluna posicionada entre "Média geral" e "Média casa" —
  mesma ordem da POC original (geral, básica, casa, fora), não no fim
  da tabela como as outras colunas novas da Fase 6/7 (chance de
  pontuar). Cor neutra (`--text-muted`), diferente das colunas casa/fora
  (verde/ocre) — não é um "lado" do mando, é uma métrica derivada.
- Decisão: sem ordenação (`SortableHeader`) nessa coluna — mesma
  decisão já tomada pra "Chance de pontuar" na Fase 6, mantém o escopo
  do que foi pedido sem inflar `sortAccessors`.
- Risco aceito: nenhum teste cobre o valor exato da tradução
  gol/assistência (isso é testado no backend); o teste web só confirma
  que o número que a API manda aparece formatado na coluna certa.
