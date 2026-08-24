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

## Correção pós-validação humana — 2026-08-24

Usuário reportou "média básica com a escrita diferente" e pediu
ordenação por média básica e chance de pontuar. Root cause da escrita:
"Média básica" e "Chance de pontuar" eram `<div>` simples, que herdam
`text-transform: uppercase` de `.player-row-header`; as colunas
vizinhas (Preço/Média geral/casa/fora) são `<button>` (via
`SortableHeader`), e o reset nativo do navegador pra `button` ignora
esse uppercase herdado — por isso só essas duas colunas apareciam em
CAIXA ALTA, destoando das outras.

- Decisão: revertida a decisão anterior de "sem ordenação" pras duas
  colunas — convertidas pra `SortableHeader`, o que resolve a
  ordenação pedida E o bug de caixa (agora seguem o mesmo tratamento
  visual dos vizinhos) na mesma mudança.
- Decisão: accessor de `chance_pontuar_percentual` mapeia `null` pra
  `-1` (fora da faixa real 0-100) — garante que atletas sem dado
  suficiente sempre ficam por último na ordenação descendente (padrão
  ao clicar pela primeira vez), sem precisar de um comparador
  específico no hook genérico `useMultiSort`.
- Risco aceito: em ordem ascendente (segundo clique no mesmo cabeçalho)
  os atletas sem dado apareceriam primeiro, não por último — mesmo
  limite do hook genérico pra qualquer campo anulável; não tratado
  porque nenhum outro accessor de `sortAccessors` precisa disso hoje.
