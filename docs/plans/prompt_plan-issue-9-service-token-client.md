# Prompt Plan: Issue #9 — Service Token no cliente HTTP

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar `[Pilar 5] Integração com Acesso Restrito do Backend & Injeção de Service Token no Frontend` com TDD, evidências e PR contra `main`.

**Architecture:** Mudança isolada no frontend React/Vite, preservando contratos de API e padrões existentes de Testing Library/Vitest. Cada alteração começa por teste RED, implementa o mínimo para GREEN e só então refatora/aplica estilo.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Vitest 4, Testing Library, oxlint, GitHub Actions/Vercel quando aplicável.

**Spec:** `docs/specs/spec-issue-9-service-token-client.md`

## Global Constraints

- Branch: `feature/9`, criada a partir de `origin/main`.
- Antes de commit: rodar lint, testes com coverage e build; o projeto ainda não expõe skill local carregada nesta sessão, então usar os comandos documentados no `package.json` até a próxima sessão recarregar skills.
- Commits convencionais e atômicos: `test:`, `feat:`, `fix:`, `docs:` ou `chore:`.
- Não incluir segredos reais em `.env.example`, logs ou evidências.
- Se aparecer bug/falha inesperada, parar e aplicar `superpowers:systematic-debugging` antes de corrigir.

---

## File Structure

- Modify: `src/api/client.ts` — headers padrão e mensagens auth.
- Modify: `src/api/client.test.ts` — TDD do header e 401/403.
- Modify/Create: `.env.example` — variável documentada.

## Ordem de Implementação

1. [ ] Adicionar testes em `src/api/client.test.ts` que esperam `X-Service-Token` em GET/POST/DELETE via stub de env; rodar esperando RED porque header não existe.
2. [ ] Implementar merge de headers em `requisitar`: headers padrão primeiro, depois `init.headers`; rodar testes específicos esperando GREEN.
3. [ ] Adicionar teste para ausência de token garantindo que não lança e não envia header; ajustar helper de env/teste se necessário.
4. [ ] Adicionar testes 401/403 esperando `ApiError.status` e mensagem “Acesso não autorizado”/“Acesso negado” quando backend não retornar detail específico; confirmar RED antes da mudança.
5. [ ] Implementar fallback específico em `extrairMensagemDeErro`; atualizar `.env.example`; rodar `npm run lint`, `npm test -- --run --coverage`, `npm run build`.

## TDD Tasks Detalhadas

### Task 1: Testes de contrato da issue 9

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
- Create: `docs/evidence/issue-9-service-token-client.md`
- Modify: `docs/decisions/issue-9-service-token-client.md`

**Interfaces:**
- Consumes: implementação verde.
- Produces: evidências para PR e validação humana.

- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm test -- --run --coverage`.
- [ ] Rodar `npm run build`.
- [ ] Registrar outputs e validação humana em `docs/evidence/issue-9-service-token-client.md`.
- [ ] Atualizar log de decisões com transições TDD → BUILD → EVIDÊNCIAS → PR, no máximo 3 itens por transição.
- [ ] Commitar atomicamente e abrir PR contra `main` com título `feat: #9 — Service Token no cliente HTTP` ou prefixo equivalente.

## Dependências

- Depende de: `origin/main` atualizado antes da criação da branch.
- Impacta: frontend `cartola-insights-web`; sem alteração de backend.

## Riscos Identificados

- `import.meta.env` é estático em Vite e pode dificultar teste; mitigar lendo token dentro da função para respeitar stubs/reloads.
- Ordem do merge de headers pode sobrescrever `Content-Type`; mitigar com teste POST explícito.

## Self-Review do Plano

- Cobertura da spec: todos os Critérios de Aceite possuem passo TDD correspondente.
- Placeholder scan: nenhum item depende de TODO/TBD; lacunas externas viram evidência/manual validation.
- Consistência de tipos/arquivos: caminhos conferidos contra estrutura atual do frontend.
