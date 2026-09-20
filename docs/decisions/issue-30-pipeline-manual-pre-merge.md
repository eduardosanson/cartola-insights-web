# Log de Decisões — Issue #30 — Pipeline manual pré-merge

## DOR → SPEC — 2026-09-20

- Decisão: execução não-supervisionada; a issue foi tomada como insumo suficiente, sem perguntas.
- Decisão: o log usa o nome `issue-30-pipeline-manual-pre-merge.md` (convenção do repo) em vez de `30.md` da DOD da issue.
- Risco aceito: a validação prática do workflow só ocorre após o primeiro merge na `main`.

## PROMPT PLAN → TDD → BUILD — 2026-09-20

- Decisão: teste de contrato textual em `src/pre-merge-manual-config.test.ts` (mesmo padrão de `ci-config.test.ts`), sem dependência de parser YAML; YAML validado à parte com PyYAML.
- Decisão: `pr_number` passa por `env` e é validado como numérico, nunca interpolado em `run` (evita injeção de script); checkout com `persist-credentials: false`.
- Decisão: status final via `if: success()` / `if: failure()` (sem `always()`), assim um run cancelado por disparo mais novo não publica status final (CA04).
- Risco aceito: `NODE_ENV=test` no step do vitest, como no `ci.yml`, para evitar o build de produção do React.
