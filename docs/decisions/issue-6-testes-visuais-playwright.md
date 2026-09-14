# Log de Decisões — Issue #6 — Infraestrutura de Testes de Regressão Visual com Playwright

## DOR → SPEC — 2026-09-13

- Decisão: tratar esta execução como automatizada e não-supervisionada (sem brainstorming interativo nem checkpoint de aprovação intermediário), conforme instrução explícita do disparo do board; ambiguidades da issue são resolvidas com a opção mais simples e registradas aqui em vez de bloquear esperando resposta.
- Decisão: manter o worktree/branch já provisionado pelo board (`eduardosanson/6-infraestrutura-de-testes`, criado a partir de `main` sem divergência) em vez de recriar `feature/6` — evita perder o isolamento já configurado sem violar a regra de "sempre a partir de main".
- Risco aceito: sem branch `feature/6` literal, a rastreabilidade do padrão de nome fica levemente diferente do convencionado; mitigado citando `Closes #6` no PR.

## SPEC → PROMPT PLAN — 2026-09-13

- Decisão: mockar a rede (`page.route`) para `/atletas` e `/contas/me` em vez de depender de um backend real no CI — a issue já sinaliza esse risco ("preferir fixture/mock simples se o projeto já tiver padrão") e o projeto não expõe um backend controlável nesta execução.
- Decisão: usar `vite dev` (via `webServer` do Playwright) como servidor sob teste, não `vite preview`, para manter a infraestrutura inicial simples (RNF01) sem exigir build de produção antes do e2e.
- Risco aceito: cobertura desta etapa é de renderização/erro crítico com dados mockados, não de integração real com o backend — consistente com o escopo "primeira versão simples" da issue.
