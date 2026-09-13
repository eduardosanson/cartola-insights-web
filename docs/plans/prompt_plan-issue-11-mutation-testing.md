# Prompt Plan: Issue #11 — Mutation Testing no Frontend com Stryker Mutator

> **Execução autônoma:** disparada pelo board, sem checkpoint interativo. Prossegue direto para implementação após este documento.

**Goal:** Configurar Stryker Mutator com runner do Vitest no `cartola-insights-web`, com gate bloqueante de 90% de mutation score local e no CI, relatório HTML e evidências no PR.

**Architecture:** Ferramenta de qualidade adicionada ao frontend existente, sem alterar comportamento de produção. Toca `package.json`, cria `stryker.config.json` e adiciona um step ao `.github/workflows/ci.yml`.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Vitest 4, `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` (10.x).

**Spec:** `docs/specs/spec-issue-11-mutation-testing.md`

## Global Constraints

- Sem checkpoint de aprovação interativo (execução de board); ambiguidades resolvidas com a suposição mais razoável e registradas em `docs/decisions/issue-11-mutation-testing.md`.
- Antes de commit: rodar `cartola-insights-web-test` e `cartola-insights-web-build`.
- Commits convencionais e atômicos: `chore:`, `feat:`, `test:`, `docs:`, `ci:`.
- Não incluir segredos nem serviços externos.
- Se aparecer bug/comportamento inesperado, aplicar `superpowers:systematic-debugging` antes de corrigir.

---

## File Structure

- Modify: `package.json` — devDependencies + script `test:mutation`.
- Create: `stryker.config.json` — configuração do Stryker.
- Modify: `.github/workflows/ci.yml` — novo step bloqueante de mutation testing.
- Modify: `.gitignore` — ignorar `reports/mutation` e `.stryker-tmp`.
- Create/Modify: `docs/evidence/issue-11-mutation-testing.md`.

## Ordem de Implementação

1. [ ] Mapear scripts atuais, Vitest e CI (feito na Fase 0 — ver decisões).
2. [ ] Instalar `@stryker-mutator/core` e `@stryker-mutator/vitest-runner` como devDependencies.
3. [ ] Criar `stryker.config.json`: `testRunner: vitest`, `mutate` cobrindo `src/**/*.{ts,tsx}` exceto testes/entry points, `coverageAnalysis: perTest`, `reporters: ["html", "clear-text", "progress"]`, `thresholds.break: 90`.
4. [ ] Adicionar script `test:mutation` ao `package.json`.
5. [ ] Rodar `npm run test:mutation` localmente; se algum mutante sobrevivente indicar lacuna real de teste, reforçar o teste existente (Red → Green) até atingir ≥90% ou confirmar que o restante é ruído aceitável dentro da meta.
6. [ ] Integrar o comando ao `.github/workflows/ci.yml` como step bloqueante (falha se `stryker` retornar código != 0, o que já acontece com `thresholds.break`).
7. [ ] Gerar relatório HTML, capturar evidências (score final, tempo de execução, prints/paths do relatório) e registrar decisões finais.
8. [ ] Rodar `cartola-insights-web-test` e `cartola-insights-web-build`, commitar, push e abrir PR.

## Dependências

- Depende de: `origin/main` (branch já criada a partir dele pelo board).
- Impacta: pipeline de CI (novo step, aumenta tempo total); nenhum código de produção é alterado, exceto testes reforçados para matar mutantes sobreviventes reais.

## Riscos Identificados

- Duração alta no CI: mitigado com `coverageAnalysis: perTest` (mais rápido que `all`) e escopo simples nesta primeira entrega; duração alta vira follow-up (RNF05), gate continua bloqueante.
- Mutantes triviais/equivalentes: registrados pontualmente como `ignore` no config com comentário, nunca como exclusão de arquivo inteiro.
- Suíte atual pode não sustentar 90%: risco aceito pela issue — reforçar testes existentes é esperado, não é ampliação de escopo.
