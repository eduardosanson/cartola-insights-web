# Evidências — Issue #6 — Infraestrutura de Testes de Regressão Visual com Playwright

## Resumo do que foi implementado

- `@playwright/test` instalado como devDependency (Chromium baixado localmente via `npx playwright install chromium`).
- `playwright.config.ts` na raiz: dois projetos (`desktop` — 1280×800, `mobile` — preset `Pixel 5`), `webServer` sobe `vite dev` automaticamente, reporter HTML, trace/screenshot retidos em falha.
- `e2e/jogadores.spec.ts`: teste único (roda nos dois projetos) que navega para `/jogadores`, mocka a rede (`e2e/support/mockApi.ts` + `e2e/fixtures/atletas.ts`), valida renderização da tabela principal, captura de screenshot não-vazia e ausência de erro crítico de página/console.
- Script `npm run test:e2e` adicionado ao `package.json`.
- `.github/workflows/ci.yml`: novos steps `npx playwright install --with-deps chromium` e `npm run test:e2e`, mais `actions/upload-artifact@v4` (`playwright-report/`, `test-results/`) com `if: failure()`.
- `.gitignore` atualizado (`playwright-report/`, `test-results/`, `blob-report/`).
- `vite.config.ts`: `exclude: ['e2e/**', ...]` para o Vitest não tentar rodar os specs do Playwright.
- `tsconfig.e2e.json` (+ referência em `tsconfig.json`): `e2e/` e `playwright.config.ts` passam a ser typecheckados por `npm run build` (`tsc -b`), sem afetar o bundle de produção.
- `src/ci-config.test.ts`: dois novos testes cobrindo os steps de Playwright e o upload de artefato no workflow de CI.

## Arquivos criados/modificados

**Criados:**
- `playwright.config.ts` (34 linhas)
- `e2e/jogadores.spec.ts` (56 linhas)
- `e2e/support/mockApi.ts` (42 linhas)
- `e2e/fixtures/atletas.ts` (79 linhas)
- `tsconfig.e2e.json` (23 linhas)
- `docs/specs/spec-issue-6-testes-visuais-playwright.md`
- `docs/plans/prompt_plan-issue-6-testes-visuais-playwright.md`
- `docs/decisions/issue-6-testes-visuais-playwright.md`
- `docs/evidence/issue-6-testes-visuais-playwright.md` (este arquivo)

**Modificados:**
- `package.json` / `package-lock.json` — dependência `@playwright/test` e script `test:e2e`.
- `.github/workflows/ci.yml` — steps de e2e + upload de artefato.
- `.gitignore` — artefatos do Playwright.
- `vite.config.ts` — exclusão de `e2e/**` do Vitest.
- `tsconfig.json` — referência a `tsconfig.e2e.json`.
- `src/ci-config.test.ts` — 2 testes novos validando o workflow.

## Comportamento esperado do ponto de vista do usuário

Nenhuma mudança visível para o usuário final — esta é uma infraestrutura de qualidade/CI. O impacto observável é: um PR que quebra o carregamento básico da Listagem de Jogadores (erro de execução, erro crítico de JS, console com erro inesperado, ou renderização vazia/quebrada) passa a ser bloqueado automaticamente no CI, em vez de chegar a produção.

## Resultado dos testes automatizados

### Suíte Vitest (unit/componentes) — `npm run coverage`

```
Test Files  42 passed (42)
     Tests  306 passed (306)
Statements  : 96.54% ( 922/955 )
Branches    : 91.3%  ( 630/690 )
Functions   : 96.18% ( 328/341 )
Lines       : 97.39% ( 824/846 )
```

(304 testes pré-existentes + 2 novos em `src/ci-config.test.ts` para os steps de Playwright no CI.)

### Lint — `npm run lint`

Exit code 0. Únicos warnings são pré-existentes em `src/contexts/AuthContext.tsx` (arquivo não tocado por esta issue).

### Build — `npm run build`

```
✓ 69 modules transformed.
dist/index.html                   0.93 kB
dist/assets/index-*.css          21.99 kB
dist/assets/index-*.js          292.41 kB
✓ built in ~300-500ms
```

`tsc -b` agora também typecheck a `e2e/` (via `tsconfig.e2e.json`) sem erros.

### Suíte Playwright (e2e) — `npm run test:e2e`

```
Running 2 tests using 2 workers
[desktop] › jogadores.spec.ts › carrega sem erro crítico e renderiza a tabela principal — passed
[mobile]  › jogadores.spec.ts › carrega sem erro crítico e renderiza a tabela principal — passed
2 passed (3.1s)
```

### Prova de que o gate realmente bloqueia (CA05)

Cenário induzido temporariamente (revertido em seguida, não faz parte do código final): injeção de um erro não tratado no carregamento da página via `page.addInitScript`, simulando um "erro crítico de JavaScript" real.

```
[WebServer] [Unhandled error] Error: erro crítico induzido para evidência CA05

Error: erros de página: erro crítico induzido para evidência CA05
Expected length: 0
Received length: 1
1 failed
  attachment: screenshot (test-results/.../test-failed-1.png)
  attachment: trace (test-results/.../trace.zip)
```

O teste falhou corretamente e gerou screenshot + trace como artefato local — mesmo artefato que o CI publica via `actions/upload-artifact` em caso de falha (RF07/CA07).

Também foi observado, durante o desenvolvimento, um caso real de falso-positivo evitado: a sonda anônima de sessão (`AuthProvider` chamando `/contas/me`, que retorna 401 mockado) gera um "Failed to load resource" no console do browser — comportamento normal de visitante não autenticado, não um bug. O teste filtra especificamente essa combinação (URL `/contas/me` + texto `401`), mantendo qualquer outro erro de console como crítico.

## Como Validar Esta Feature

### Pré-requisitos

- [ ] Node.js 20+ e `npm ci` executado na raiz do frontend.
- [ ] Nenhum backend real é necessário — o e2e mocka toda a rede.

### Passo a Passo

1. Na raiz do projeto, rode `npx playwright install chromium` (uma vez, para baixar o browser).
2. Rode `npm run test:e2e`.
3. Verifique que os dois projetos (`desktop`, `mobile`) aparecem como `passed`. ✅
4. Rode `npx playwright show-report` para abrir o relatório HTML gerado em `playwright-report/`. ✅
5. No GitHub, abra um PR contra `main`: o job `Web CI` deve mostrar os novos steps de Playwright e bloquear o merge se algum deles falhar. ✅

### Casos de Borda

- Quebrar propositalmente a Listagem de Jogadores (ex.: renomear temporariamente `role="table"` ou lançar um erro em `useEffect`) → `npm run test:e2e` deve falhar e gerar `test-results/*/test-failed-*.png` e `trace.zip`.
- Rodar offline (sem qualquer backend em `localhost:8000`) → a suíte continua passando, pois toda chamada de rede é interceptada por `page.route` antes de qualquer requisição real.
- Rodar com um `.env.local` definindo `VITE_API_BASE_URL` diferente (ex.: outro backend local) → a suíte continua passando, pois `playwright.config.ts` força essa variável no processo do `vite dev` que ele mesmo sobe, sobrescrevendo qualquer `.env`/`.env.local` (achado de code review na PR #26, ver `docs/decisions`).

## Fora de Escopo (confirmado)

- Nenhuma baseline de screenshot foi versionada.
- Nenhuma comparação pixel a pixel (`toHaveScreenshot`) foi usada.
- Detalhe do Atleta, Pentágono de Qualidade, Raio-X de Confronto e viewport tablet não foram cobertos — ficam para uma etapa posterior de regressão visual completa.
