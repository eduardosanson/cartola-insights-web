# Log de Decisões — Fase 6 (Lista de Jogadores Avançada, web)

## TDD → EVIDÊNCIAS — 2026-08-23

- Decisão: sem spec/prompt_plan formais nesta fase — segue a convenção do
  projeto ("documentar depois de implementar, não antes",
  `CLAUDE.md`) para uma extensão pequena e já contratada pelo backend
  (Fase 6 backend, `../../../backend/docs/specs/spec-fase6-lista-avancada.md`):
  só consumir 2 campos novos (`chance_pontuar_*`) e 1 filtro novo
  (`mando`) que já existiam na API.
- Decisão: filtro de mando renderizado como grupo de botões
  `aria-pressed` (`role="group"`), mesmo padrão acessível já usado pelos
  chips de posição (`PositionChips`) — não um `<select>`, para manter
  consistência visual e de teste (`getByRole('button', { pressed: true
  }))` já é o padrão dos testes existentes de `PositionChips`.
- Decisão: `chance_pontuar_classificacao` traduzido pra rótulo em
  português (`Baixa`/`Média`/`Alta`) direto na tabela, sem componente
  novo tipo `SeloRisco` — é uma célula de tabela, não um badge no
  cabeçalho de detalhe; `null` vira `—`, mesmo padrão dos outros campos
  numéricos ausentes na lista.
- Risco aceito: nenhum teste cobre explicitamente a combinação
  filtro-de-mando + paginação (página 2 com mando ativo) — mesmo gap já
  aceito no backend (`../../../backend/docs/decisions/fase6-lista-avancada.md`,
  branch 85-87 de `listar_atletas.py` não coberta isoladamente).
