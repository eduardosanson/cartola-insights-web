# Log de Decisões — Issue #8 — Pipeline CI GitHub Actions

## DOR → SPEC — 2026-08-29

- Decisão: tratar a issue GitHub #8 como unidade independente de entrega em branch `feature/8` porque os arquivos impactados são isoláveis dos demais itens Ready.
- Decisão: manter o escopo restrito ao frontend `cartola-insights-web`; alterações externas ficam como validação/evidência, não como pré-requisito bloqueante local.
- Risco aceito: tarefas paralelas podem tocar arquivos comuns (`package.json`, configs); mitigação é worktree separado por issue e PRs pequenos contra `main`.

## SPEC → PROMPT PLAN — 2026-08-29

- Decisão: decompor a execução em TDD por critério de aceite, depois implementação mínima e evidências, para preservar Red → Green → Refactor.
- Decisão: usar os comandos reais do `package.json` nesta sessão porque `.claude/skills/` ainda não está carregado como skill local pelo runtime atual.
- Risco aceito: validações externas como GitHub Actions/Vercel podem exigir evidência posterior ao push/PR.
