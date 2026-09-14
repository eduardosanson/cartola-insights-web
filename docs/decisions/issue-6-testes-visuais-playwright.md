# Log de Decisões — Issue #6 — Infraestrutura de Testes de Regressão Visual com Playwright

## DOR → SPEC — 2026-09-13

- Decisão: tratar esta execução como automatizada e não-supervisionada (sem brainstorming interativo nem checkpoint de aprovação intermediário), conforme instrução explícita do disparo do board; ambiguidades da issue são resolvidas com a opção mais simples e registradas aqui em vez de bloquear esperando resposta.
- Decisão: manter o worktree/branch já provisionado pelo board (`eduardosanson/6-infraestrutura-de-testes`, criado a partir de `main` sem divergência) em vez de recriar `feature/6` — evita perder o isolamento já configurado sem violar a regra de "sempre a partir de main".
- Risco aceito: sem branch `feature/6` literal, a rastreabilidade do padrão de nome fica levemente diferente do convencionado; mitigado citando `Closes #6` no PR.

## SPEC → PROMPT PLAN — 2026-09-13

- Decisão: mockar a rede (`page.route`) para `/atletas` e `/contas/me` em vez de depender de um backend real no CI — a issue já sinaliza esse risco ("preferir fixture/mock simples se o projeto já tiver padrão") e o projeto não expõe um backend controlável nesta execução.
- Decisão: usar `vite dev` (via `webServer` do Playwright) como servidor sob teste, não `vite preview`, para manter a infraestrutura inicial simples (RNF01) sem exigir build de produção antes do e2e.
- Risco aceito: cobertura desta etapa é de renderização/erro crítico com dados mockados, não de integração real com o backend — consistente com o escopo "primeira versão simples" da issue.

## PROMPT PLAN → TDD — 2026-09-13

- Decisão: instalar apenas o browser Chromium via `npx playwright install chromium` (sem `--with-deps`, que exige `sudo` indisponível neste ambiente); os dois projetos (desktop/mobile) usam o mesmo engine Chromium com viewports/dispositivos diferentes, então isso não reduz a cobertura pedida na issue. No CI (`ubuntu-latest`, suportado oficialmente) o step usa `--with-deps` normalmente.
- Decisão: filtrar do critério de "erro crítico de console" especificamente a combinação `/contas/me` + `401` — o `AuthProvider` sonda a sessão atual ao montar qualquer página, e um visitante anônimo recebe 401 (mockado) que o browser loga como "Failed to load resource"; isso é comportamento esperado da aplicação, não um bug, e o filtro é restrito a essa URL+status para não mascarar outros erros reais.
- Risco aceito: nenhum — a suíte foi validada tanto no caminho feliz (GREEN) quanto com uma falha induzida temporariamente (erro de página não tratado via `page.addInitScript`), confirmando que erros críticos de verdade continuam bloqueando o teste.

## TDD → BUILD — 2026-09-13

- Decisão: excluir `e2e/**` do Vitest (`vite.config.ts`) — os specs do Playwright usam os mesmos globais `test`/`describe`, e sem a exclusão o Vitest tentava executá-los e colidia com o test runner do Playwright.
- Decisão: criar `tsconfig.e2e.json` e referenciá-lo em `tsconfig.json` para que `npm run build` (`tsc -b`) também typecheque `e2e/` e `playwright.config.ts`, mantendo o mesmo padrão de qualidade do restante do repositório sem afetar o bundle de produção (`noEmit`).
- Risco aceito: nenhum — mudanças aditivas, sem alterar comportamento de produção.

## BUILD → EVIDÊNCIAS — 2026-09-13

- Decisão: usar o mock de rede (`page.route`) também para `/contas/me`, cobrindo o efeito colateral do `AuthProvider` que monta em toda página da aplicação, e não só `/atletas` — sem isso o e2e dependeria de uma tentativa real de rede mesmo fora do escopo funcional da Listagem de Jogadores.
- Decisão: adicionar 2 testes em `src/ci-config.test.ts` cobrindo os novos steps de Playwright no workflow (instalação de browser, execução do `test:e2e`, upload de artefato em falha), seguindo o padrão já usado pela issue #8 para validar `.github/workflows/ci.yml` por asserções de texto.
- Risco aceito: nenhum — `npm run lint`, `npm run coverage` (306 testes, cobertura ≥90% em todas as métricas) e `npm run build` passam sem regressão antes da abertura do PR.

## PR REVIEW (chatgpt-codex-connector) → FIX — 2026-09-13

- Decisão: forçar `VITE_API_BASE_URL` no `webServer.env` do `playwright.config.ts` em resposta ao achado P2 na PR #26 — um `.env`/`.env.local` local com origem diferente de `http://localhost:8000` fazia o `vite dev` chamar essa outra origem enquanto `mockApi.ts` só interceptava `localhost:8000`, vazando o e2e para fora do mock (quebra de RNF04/RNF05). Reproduzido localmente (`.env.local` com `localhost:9999` → teste trava por timeout esperando a tabela) e confirmado corrigido (mesmo cenário → suíte passa) antes de aplicar.
- Decisão: extrair a origem para `e2e/support/env.ts`, compartilhada entre `playwright.config.ts` e `mockApi.ts`, em vez de manter o literal duplicado nos dois arquivos.
- Risco aceito: nenhum — mudança aditiva e testada nos dois sentidos (com e sem o fix, reproduzindo e depois eliminando a falha).
