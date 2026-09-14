# Prompt Plan: Issue #10 — Security headers e sanitização defensiva

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar `[Pilar 3] Hardening de Segurança no Frontend: Headers HTTP no Vercel (vercel.json) & Sanitização` com TDD, evidências e PR contra `main`.

**Architecture:** Mudança isolada no frontend React/Vite: (1) configuração estática em `vercel.json`, sem código de runtime; (2) uma função utilitária pura de sanitização, aplicada nos dois pontos de entrada de busca livre existentes. Cada alteração começa por teste RED, implementa o mínimo para GREEN e só então refatora.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Vitest 4, Testing Library, oxlint, GitHub Actions/Vercel.

**Spec:** `docs/specs/spec-issue-10-security-headers-sanitization.md`

## Global Constraints

- Branch: `eduardosanson/10-hardening-de-seguranca` (ver decisão em `docs/decisions/issue-10-security-headers-sanitization.md` sobre por que não é `feature/10`).
- Antes de commit: `cartola-insights-web-test` (lint + coverage) e `cartola-insights-web-build` (typecheck + build).
- Commits convencionais e atômicos: `test:`, `feat:`, `fix:`, `docs:` ou `chore:`.
- Não incluir segredos em `.env.example`/evidências.
- Bug/falha inesperada → `superpowers:systematic-debugging` antes de corrigir.

---

## File Structure

- Modify: `vercel.json` — bloco `headers`.
- Create: `src/security-headers.test.ts` — valida o JSON de headers (mesmo padrão de `src/ci-config.test.ts`).
- Create: `src/utils/sanitizeSearchInput.ts` + `src/utils/sanitizeSearchInput.test.ts`.
- Modify: `src/components/AtletaAutocomplete.tsx` (+ `.test.tsx`) — aplica a sanitização no `onChange`.
- Modify: `src/pages/Jogadores.tsx` (+ `.test.tsx`) — aplica a sanitização no `onChange`.

## Ordem de Implementação

1. [ ] Criar `src/security-headers.test.ts` esperando os 4 headers de RF02 + RF03/RF04 em `vercel.json`; confirmar RED (arquivo/headers ainda não existem).
2. [ ] Atualizar `vercel.json` com o bloco `headers`, preservando `rewrites`; confirmar GREEN.
3. [ ] Criar `src/utils/sanitizeSearchInput.test.ts` cobrindo: remoção de tags HTML/script, preservação de nomes acentuados/apóstrofo/hífen, limite de tamanho; confirmar RED.
4. [ ] Implementar `src/utils/sanitizeSearchInput.ts`; confirmar GREEN.
5. [ ] Adicionar teste em `AtletaAutocomplete.test.tsx` e `Jogadores.test.tsx` digitando `<img src=x onerror=alert(1)>` e esperando o input/estado sem a tag crua; confirmar RED.
6. [ ] Aplicar `sanitizeSearchInput` no `onChange` dos dois componentes; confirmar GREEN sem quebrar os testes de filtro por nome já existentes.
7. [ ] Rodar `cartola-insights-web-test` e `cartola-insights-web-build`; registrar evidências e validação humana (incluindo passo manual de securityheaders.com/curl pós-deploy).

## TDD Tasks Detalhadas

### Task 1: Security headers em `vercel.json`

**Files:** `vercel.json`, `src/security-headers.test.ts`

**Interfaces:**
- Consumes: `vercel.json` atual (só `rewrites`).
- Produces: `vercel.json` com `headers` cobrindo CA01/CA02.

- [ ] Escrever teste que lê `vercel.json` via `JSON.parse` e assere `source`, cada header e valor esperado (incluindo ausência de `*` na CSP).
- [ ] Rodar o teste isolado e confirmar falha por header ausente (não erro de parse).
- [ ] Implementar o bloco `headers` mínimo para todos os CAs de RF02-RF04 passarem.

### Task 2: `sanitizeSearchInput`

**Files:** `src/utils/sanitizeSearchInput.ts`, `src/utils/sanitizeSearchInput.test.ts`

**Interfaces:**
- Consumes: string livre digitada pelo usuário.
- Produces: string sem tags HTML/caracteres de controle, truncada, preservando texto normal (CA03).

- [ ] Escrever casos: `<script>alert(1)</script>` → vazio; `<img src=x onerror=alert(1)>Neymar` → `Neymar`; `José D'Ávila-Neto` → inalterado; string > limite → truncada.
- [ ] Confirmar RED (módulo não existe).
- [ ] Implementar a função com regex de remoção de tags + caracteres de controle + `slice`.
- [ ] Confirmar GREEN.

### Task 3: Aplicar sanitização nos campos de busca

**Files:** `src/components/AtletaAutocomplete.tsx`, `.test.tsx`, `src/pages/Jogadores.tsx`, `.test.tsx`

**Interfaces:**
- Consumes: `sanitizeSearchInput` da Task 2.
- Produces: `onChange` dos dois inputs de busca livre sanitizando antes de `setState`.

- [ ] Adicionar teste (RED) simulando digitação de payload HTML e esperando o `value` do input já sanitizado.
- [ ] Aplicar `sanitizeSearchInput(e.target.value)` no `setNomeInput` dos dois componentes.
- [ ] Confirmar GREEN e que os testes de filtro por nome (existentes) continuam passando.

### Task 4: Refactor, evidências e PR

**Files:**
- Create: `docs/evidence/issue-10-security-headers-sanitization.md`
- Modify: `docs/decisions/issue-10-security-headers-sanitization.md`

- [ ] Rodar `cartola-insights-web-test` (lint + coverage).
- [ ] Rodar `cartola-insights-web-build`.
- [ ] Registrar outputs, validação humana e passo manual de securityheaders.com/curl em `docs/evidence/issue-10-security-headers-sanitization.md`.
- [ ] Atualizar log de decisões com a transição TDD → BUILD → EVIDÊNCIAS → PR (máx. 3 itens).
- [ ] Commitar atomicamente, `git push -u origin eduardosanson/10-hardening-de-seguranca` e abrir PR contra `main` com `Closes #10`.

## Dependências

- Depende de: `origin/main` (branch já parte do mesmo commit).
- Impacta: frontend `cartola-insights-web`; sem alteração de backend.

## Riscos Identificados

- CSP muito restritiva pode bloquear fonts/estilos inline; mitigado com `style-src 'unsafe-inline'` documentado e whitelist explícita de Google Fonts.
- Sanitização agressiva pode prejudicar busca por nomes com acentos/apóstrofo; mitigado por não remover letras Unicode, só tags/controles.
- Nota A/A+ real do securityheaders.com só é confirmável após deploy; evidência local fica limitada a inspeção estática + `curl -I` do build servido localmente.

## Self-Review do Plano

- Cobertura da spec: todos os CAs (CA01-CA04) têm passo TDD correspondente (Task 1 → CA01/CA02, Task 2/3 → CA03, Task 4 → CA04).
- Placeholder scan: nenhum item depende de TODO/TBD; validação externa (securityheaders.com) é passo manual explícito, não bloqueante do PR.
- Consistência de arquivos: caminhos conferidos contra a estrutura atual (`src/ci-config.test.ts` como modelo, `src/utils/formatNumber.ts` como convenção de nomeação).
