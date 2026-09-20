# Spec: Pipeline manual pré-merge (issue #30)

## Contexto de Negócio
Hoje um PR pode ser mesclado na `main` sem que a validação completa da branch tenha sido acionada de forma consciente. O gate manual dá ao dono um ponto de controle explícito antes do merge, com rastro no PR (commit status `pre-merge-manual`).

## Requisitos Funcionais
- RF01: `.github/workflows/pre-merge-manual.yml` com `on: workflow_dispatch` e input obrigatório `pr_number`.
- RF02: resolver SHA e branch via `gh pr view`; abortar se o PR não estiver aberto ou vier de fork; checkout do SHA.
- RF03: `npm ci`, `npm run lint`, `npm run build`, `npm test -- --run`, `npm run test:e2e` (chromium local).
- RF04: publicar o status `pre-merge-manual` no SHA (`pending`, depois `success`/`failure`) com `target_url` da execução.
- RF05: `concurrency` por `pr_number` com `cancel-in-progress: true`.
- RF06: documentar no README.

## Requisitos Não-Funcionais
- RNF01: permissões mínimas (`contents: read`, `pull-requests: read`, `statuses: write`); nunca executar código de fork.
- RNF02: mutation testing e E2E contra a Vercel ficam fora.
- RNF03: `ci.yml` permanece inalterado.

## Critérios de Aceite
- CA01: PR aberto do próprio repo → status `pending` e depois `success` se tudo passa.
- CA02: teste quebrado → status `failure` com link para os logs.
- CA03: PR fechado ou de fork → falha cedo, sem `success`.
- CA04: dois disparos para o mesmo PR → só o mais recente publica o status final.
- CA05: YAML válido; lint, build e testes verdes.

## Definition of Done (DOD)
- [ ] Workflow implementado e YAML validado
- [ ] README documenta o fluxo
- [ ] lint, build e testes verdes
- [ ] PR aberto com `Closes #30` e passo a passo de validação
- [ ] Decisões registradas em `docs/decisions/issue-30-pipeline-manual-pre-merge.md`

## Fora de Escopo
Ativar a regra de proteção da `main` (task [HUMANO] separada); mutation testing; E2E contra preview da Vercel.
