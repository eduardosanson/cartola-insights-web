# Prompt Plan: Issue #8 — Pipeline CI GitHub Actions

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar `[Pilar 2] Validação Contínua: Pipeline de CI Automatizado no Frontend (GitHub Actions)` com TDD, evidências e PR contra `main`.

**Architecture:** Mudança isolada no frontend React/Vite, preservando contratos de API e padrões existentes de Testing Library/Vitest. Cada alteração começa por teste RED, implementa o mínimo para GREEN e só então refatora/aplica estilo.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Vitest 4, Testing Library, oxlint, GitHub Actions/Vercel quando aplicável.

**Spec:** `docs/specs/spec-issue-8-ci-github-actions.md`

## Global Constraints

- Branch: `feature/8`, criada a partir de `origin/main`.
- Antes de commit: rodar lint, testes com coverage e build; o projeto ainda não expõe skill local carregada nesta sessão, então usar os comandos documentados no `package.json` até a próxima sessão recarregar skills.
- Commits convencionais e atômicos: `test:`, `feat:`, `fix:`, `docs:` ou `chore:`.
- Não incluir segredos reais em `.env.example`, logs ou evidências.
- Se aparecer bug/falha inesperada, parar e aplicar `superpowers:systematic-debugging` antes de corrigir.

---

## File Structure

- Create: `.github/workflows/ci.yml` — pipeline principal.
- Modify: `package.json` apenas se faltar script exigido.
- Create/Modify: docs de evidência com resultado local e link da Action após push.

## Ordem de Implementação

1. [ ] Criar teste estrutural simples em `src/tests/ci-config.test.ts` que lê `.github/workflows/ci.yml` e verifica comandos obrigatórios; rodar esperando RED por arquivo ausente.
2. [ ] Criar `.github/workflows/ci.yml` com triggers, Node 20, cache npm e steps obrigatórios; rodar teste estrutural esperando GREEN.
3. [ ] Rodar localmente os mesmos comandos: `npm ci` se lockfile permitir, `npm run lint`, `npx tsc -b`, `npm test -- --run --coverage`.
4. [ ] Atualizar evidências com comandos locais; após PR, anexar link da execução GitHub Actions.

## TDD Tasks Detalhadas

### Task 1: Testes de contrato da issue 8

**Files:**
- Testar nos arquivos listados na seção File Structure.

**Interfaces:**
- Consumes: comportamento atual do frontend em `origin/main`.
- Produces: testes que falham pelo motivo esperado antes da implementação.

- [ ] Escrever o menor teste que represente CA01 da spec.
- [ ] Rodar o teste específico e confirmar falha por funcionalidade/configuração ausente, não por erro de sintaxe.
- [ ] Repetir para demais CAs antes de alterar produção/configuração.

### Task 2: Implementação mínima

**Files:**
- Modificar apenas os arquivos de produção/configuração declarados nesta issue.

**Interfaces:**
- Consumes: testes RED da Task 1.
- Produces: comportamento/configuração que satisfaz os CAs sem ampliar escopo.

- [ ] Implementar o mínimo para o primeiro teste passar.
- [ ] Rodar o teste específico e confirmar GREEN.
- [ ] Repetir CA por CA, mantendo testes anteriores verdes.

### Task 3: Refactor, evidências e PR

**Files:**
- Create: `docs/evidence/issue-8-ci-github-actions.md`
- Modify: `docs/decisions/issue-8-ci-github-actions.md`

**Interfaces:**
- Consumes: implementação verde.
- Produces: evidências para PR e validação humana.

- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm test -- --run --coverage`.
- [ ] Rodar `npm run build`.
- [ ] Registrar outputs e validação humana em `docs/evidence/issue-8-ci-github-actions.md`.
- [ ] Atualizar log de decisões com transições TDD → BUILD → EVIDÊNCIAS → PR, no máximo 3 itens por transição.
- [ ] Commitar atomicamente e abrir PR contra `main` com título `feat: #8 — Pipeline CI GitHub Actions` ou prefixo equivalente.

## Dependências

- Depende de: `origin/main` atualizado antes da criação da branch.
- Impacta: frontend `cartola-insights-web`; sem alteração de backend.

## Riscos Identificados

- Teste estrutural de YAML pode exigir parser; mitigar lendo texto puro com `fs.readFileSync` para evitar dependência.
- Branch protection pode exigir configuração manual do GitHub; documentar como validação humana se não houver API disponível.

## Self-Review do Plano

- Cobertura da spec: todos os Critérios de Aceite possuem passo TDD correspondente.
- Placeholder scan: nenhum item depende de TODO/TBD; lacunas externas viram evidência/manual validation.
- Consistência de tipos/arquivos: caminhos conferidos contra estrutura atual do frontend.
