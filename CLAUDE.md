# Cartola Insights — Web

## Stack

React 19, Vite 8, TypeScript 6, Vitest 4, Testing Library, oxlint e GitHub Actions/Vercel quando aplicável.

## Skills disponíveis

- `cartola-insights-web-test` — lint + testes com coverage do frontend.
- `cartola-insights-web-build` — typecheck e build de produção do frontend.

## Fluxo de trabalho

Segue o fluxo global definido em `~/.claude/CLAUDE.md`. A documentação de planejamento vive em `docs/`: specs em `docs/specs/`, planos de implementação em `docs/plans/`, decisões em `docs/decisions/` e evidências em `docs/evidence/`.

## Convenções gerais

- Código não-verboso, arquivos pequenos e organizados por responsabilidade.
- Documentar depois de implementar, não antes.
- Testes ≥ 90% de cobertura.
- Branches de feature para issues GitHub usam `feature/<issue-number>` quando não houver ID externo.
- Antes de commits: rodar `cartola-insights-web-test` e `cartola-insights-web-build` quando as skills estiverem carregadas; em sessões onde skills locais ainda não foram recarregadas, executar os comandos equivalentes documentados nos arquivos das skills.
