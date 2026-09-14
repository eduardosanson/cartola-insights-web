# Prompt Plan: Issue #6 — Infraestrutura de Testes de Regressão Visual com Playwright

> **Execução:** automatizada e não-supervisionada (disparada pelo board). Sem checkpoint de aprovação intermediário — seguir direto DOR/SPEC → TDD → BUILD → EVIDÊNCIAS → PR.

**Goal:** Entregar a primeira versão do pipeline visual com Playwright — simples, bloqueante no PR, cobrindo somente a Listagem de Jogadores em desktop e mobile — com TDD, evidências e PR contra `main`.

**Architecture:** Nova infraestrutura de e2e isolada em `e2e/` na raiz do frontend, sem tocar em código de produção. Mock de rede via `page.route` para eliminar dependência de backend real. Integração ao CI existente (`.github/workflows/ci.yml`) como step adicional bloqueante, com upload de artefato em caso de falha.

**Tech Stack:** React 19, Vite 8, TypeScript 6, `@playwright/test` (Chromium), GitHub Actions.

**Spec:** `docs/specs/spec-issue-6-testes-visuais-playwright.md`

## Global Constraints

- Branch: worktree já criado pelo board como `eduardosanson/6-infraestrutura-de-testes`, a partir de `origin/main` (verificado sem divergência) — mantido em vez de recriar `feature/6` para não perder o isolamento já provisionado.
- Antes de commit: rodar `cartola-insights-web-test` e `cartola-insights-web-build` (ou os comandos equivalentes do `package.json`).
- Commits convencionais e atômicos: `test:`, `feat:`, `chore:`, `docs:`.
- Não versionar baseline de screenshot nem introduzir comparação pixel a pixel.
- Se aparecer bug/falha inesperada, aplicar `superpowers:systematic-debugging` antes de corrigir.

---

## File Structure

- Create: `playwright.config.ts` — configuração raiz (projetos desktop/mobile, webServer, reporter, artefatos).
- Create: `e2e/fixtures/atletas.ts` — fixture mínima de atletas para mock de rede.
- Create: `e2e/support/mockApi.ts` — helper de interceptação de rede (`/atletas`, `/contas/me`, fallback).
- Create: `e2e/jogadores.spec.ts` — teste da Listagem de Jogadores (roda nos dois projetos/viewports).
- Modify: `package.json` — script `test:e2e` (e `test:e2e:report` opcional).
- Modify: `.gitignore` — ignorar `playwright-report/`, `test-results/`, `blob-report/`.
- Modify: `.github/workflows/ci.yml` — step de instalação de browsers, execução do e2e e upload de artefato em falha.
- Create: `docs/evidence/issue-6-testes-visuais-playwright.md` — evidências e passo a passo de validação humana.
- Modify: `docs/decisions/issue-6-testes-visuais-playwright.md` — log de decisões por transição.

## Ordem de Implementação

1. [ ] Instalar `@playwright/test` como devDependency e os browsers do Chromium (`npx playwright install --with-deps chromium`).
2. [ ] Criar fixture de atletas e helper de mock de rede.
3. [ ] Criar `playwright.config.ts` com dois projetos (`desktop`, `mobile`), `webServer` apontando para `npm run dev`, reporter HTML e captura de trace/screenshot em falha.
4. [ ] Escrever o teste RED da Listagem de Jogadores (esperado falhar por ausência de config/infra antes do passo 3, e depois validado GREEN).
5. [ ] Adicionar script `test:e2e` ao `package.json`.
6. [ ] Rodar a suíte localmente (`npm run test:e2e`) e confirmar GREEN nos dois projetos.
7. [ ] Induzir uma falha controlada (ex.: seletor/assert temporariamente errado) para provar que a suíte realmente bloqueia — depois reverter (evidência do CA05).
8. [ ] Integrar ao CI (`.github/workflows/ci.yml`) como step bloqueante, com upload do relatório/trace em `if: failure()`.
9. [ ] Atualizar `.gitignore`.
10. [ ] Rodar `cartola-insights-web-test` e `cartola-insights-web-build` (lint + coverage + typecheck + build) para garantir que a nova infraestrutura não quebrou nada existente.
11. [ ] Registrar evidências, atualizar log de decisões e abrir PR contra `main` com `Closes #6`.

## TDD Tasks Detalhadas

### Task 1: Teste RED da Listagem de Jogadores

**Files:**
- Create: `e2e/fixtures/atletas.ts`, `e2e/support/mockApi.ts`, `e2e/jogadores.spec.ts`.

**Interfaces:**
- Consumes: app real servido por `vite dev`, rede mockada via `page.route`.
- Produces: teste que falha inicialmente (`playwright.config.ts` ainda não existe / projetos não configurados).

- [ ] Escrever o teste para desktop e mobile: navega para `/jogadores`, aguarda a tabela renderizar, valida linhas visíveis com os dados do fixture, valida ausência de erro crítico de console/página, e valida screenshot full-page não vazio.
- [ ] Rodar `npx playwright test` e confirmar falha esperada (config ausente), não erro de sintaxe.

### Task 2: Implementação mínima da infraestrutura

**Files:**
- Create: `playwright.config.ts`.
- Modify: `package.json` (script `test:e2e`).

**Interfaces:**
- Consumes: teste RED da Task 1.
- Produces: suíte executável localmente que atende RF01–RF05.

- [ ] Implementar `playwright.config.ts` com os dois projetos/viewports, `webServer` e artefatos de falha (trace/screenshot/report).
- [ ] Rodar `npm run test:e2e` e confirmar GREEN nos dois projetos.
- [ ] Induzir falha controlada temporária (CA05) e confirmar que a suíte falha e produz artefato local (`playwright-report/`), depois reverter.

### Task 3: CI, refactor, evidências e PR

**Files:**
- Modify: `.github/workflows/ci.yml`, `.gitignore`.
- Create: `docs/evidence/issue-6-testes-visuais-playwright.md`.
- Modify: `docs/decisions/issue-6-testes-visuais-playwright.md`.

**Interfaces:**
- Consumes: suíte e2e verde localmente.
- Produces: gate de CI bloqueante + evidências para PR e validação humana.

- [ ] Adicionar steps de instalação de browsers Playwright e execução de `npm run test:e2e` ao workflow, com `permissions: contents: read` mantido.
- [ ] Adicionar `actions/upload-artifact` para `playwright-report/` e `test-results/` com `if: failure()`.
- [ ] Rodar `cartola-insights-web-test` e `cartola-insights-web-build` (ou comandos equivalentes) e registrar output.
- [ ] Escrever `docs/evidence/issue-6-testes-visuais-playwright.md` com passo a passo de validação humana e evidência do cenário de falha induzida.
- [ ] Atualizar log de decisões (DOR→SPEC, SPEC→PROMPT PLAN, PROMPT PLAN→TDD, TDD→BUILD, BUILD→EVIDÊNCIAS), máx. 3 itens por transição.
- [ ] Commitar atomicamente, dar `git push -u origin <branch>` e abrir PR contra `main` com `Closes #6`.

## Dependências

- Depende de: `origin/main` atualizado (confirmado sem divergência antes do início).
- Impacta: pipeline de CI (`.github/workflows/ci.yml`) e tempo de execução do PR (novo step Playwright).

## Riscos Identificados

- Instalação de browsers Playwright pode ser lenta/pesada no CI; mitigar restringindo a apenas Chromium (`--with-deps chromium`), suficiente para os dois projetos (desktop/mobile emulado).
- Ausência de backend real pode mascarar erros reais de integração; mitigar documentando explicitamente que o e2e cobre renderização/erro crítico com dados mockados, não integração real (RNF05, fora de escopo).
- `vite dev` como servidor de teste pode divergir levemente do build de produção; aceito nesta etapa simples (RNF01), podendo evoluir para `vite preview` em iteração futura de regressão visual completa.

## Self-Review do Plano

- Cobertura da spec: RF01–RF07 e CA01–CA07 mapeados em passos concretos (config, script, testes desktop/mobile, CI, artefato de falha).
- Placeholder scan: nenhum item depende de TODO/TBD; ambiguidades da issue (mock de dados, servidor, verificação de screenshot) foram resolvidas e registradas como decisão assumida na spec.
- Consistência de arquivos: caminhos conferidos contra a estrutura atual (`src/pages/Jogadores.tsx`, `src/api/atletas.ts`, `src/contexts/AuthContext.tsx`, `.github/workflows/ci.yml`).
