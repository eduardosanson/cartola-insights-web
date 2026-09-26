# Issue #44 — Decisões de Implementação

## DOR → SPEC — 2026-09-26

- Decisão: Replicar workflow `branch-up-to-date.yml` como workflow separado em vez de integrar ao CI existente — mantém concerns separados (CI é teste/build; branch-up-to-date é gate pré-merge)
- Decisão: Usar TypeScript + Vitest para testes de configuração do workflow em vez de Python (conforme stack do projeto) — alinha com convenções existentes de `ci-config.test.ts`

## SPEC → TDD — 2026-09-26

- Decisão: Validar workflow com testes que checam existência de arquivo + conteúdo (git commands, eventos de trigger) — mais robusto que testes de snapshot YAML
- Risco aceito: Testes checam strings brutas em vez de parsed YAML; se alguém reformatar indentação o teste pode quebrar (baixa probabilidade, fácil corrigir)

## TDD → BUILD — 2026-09-26

- Decisão: Usar `git merge-base --is-ancestor` para validação de branch up-to-date — comando padrão Git, eficiente, sem dependências extras
- Decisão: `fetch-depth: 0` no checkout para garantir que o repositório local tem todo histórico antes de comparar com origin/main — evita falsos negativos
