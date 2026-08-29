# Evidências — Issue #8: Pipeline CI GitHub Actions Frontend

Data: 2026-08-29

## Resumo da Feature

Configuração do pipeline de Integração Contínua do frontend (`cartola-insights-web`) via GitHub Actions, cobrindo:

- Workflow `.github/workflows/ci.yml` acionado em `push` para `main` e `pull_request` contra `main`.
- Runner `ubuntu-latest`.
- Setup Node.js 20 com cache npm por `actions/setup-node@v4`.
- Execução sequencial de `npm ci`, `npm run lint`, `npx tsc -b` e `npm test -- --run --coverage`.
- Teste estrutural `src/ci-config.test.ts` validando existência, gatilhos e comandos obrigatórios do workflow.
- Ajuste de `tsconfig.app.json` para incluir tipos Node no projeto de testes que lê arquivos via `node:fs`/`node:path`.

---

## 1. Instalação determinística

Comando executado:

```bash
npm ci
```

Output:

```text
added 7 packages, and audited 8 packages in 701ms

1 package is looking for funding
  run `npm fund` for details

found 0 vulnerabilities

EXIT_CODE=0
```

---

## 2. Lint

Comando executado:

```bash
npm run lint
```

Output:

```text
> cartola-insights-web@0.0.0 lint
> oxlint

src/contexts/AuthContext.tsx:51:17: warning react(only-export-components): Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components.
src/contexts/AuthContext.tsx:36:5: warning react(set-state-in-effect): Calling setState synchronously within an effect can trigger cascading renders help: Effects should synchronize React with external systems. Calling setState synchronously inside an effect starts another render and is usually unnecessary. Derive the value during render, initialize state directly, or update it from the event that caused the change. Use an effect only when synchronizing with an external system.

EXIT_CODE=0
```

Resultado: sem erros de lint; warnings preexistentes fora do escopo da issue.

---

## 3. Testes com cobertura

Comando executado:

```bash
NODE_ENV=test npm run coverage
```

Observação: o ambiente local da sessão define `NODE_ENV=production`; por isso a validação local força `NODE_ENV=test` para executar React Testing Library/Vitest corretamente. O workflow no GitHub Actions executa em ambiente limpo com o comando exigido pela issue.

Output resumido:

```text
RUN  v4.1.11 /home/eduardosanson/Dev/cartola-insights/web/.worktrees/feature-8-ci
Coverage enabled with v8

Test Files  40 passed (40)
Tests       232 passed (232)

Coverage summary:
Statements : 96.37% (878/911)
Branches   : 90.75% (599/660)
Functions  : 96.1% (321/334)
Lines      : 97.27% (786/808)

EXIT_CODE=0
```

---

## 4. Typecheck

Comando executado:

```bash
npx tsc -b
```

Output:

```text
EXIT_CODE=0
```

---

## 5. Build de produção

Comando executado:

```bash
npm run build
```

Output:

```text
> cartola-insights-web@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 68 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.93 kB │ gzip:  0.51 kB
dist/assets/index-wPQRAs04.css   20.57 kB │ gzip:  4.52 kB
dist/assets/index-DFP862Fi.js   291.49 kB │ gzip: 88.99 kB

✓ built in 179ms

EXIT_CODE=0
```

---

## 6. Guia de Validação Humana

### Pré-requisitos

- [ ] Acesso ao repositório GitHub `cartola-insights-web`.
- [ ] PR da branch `feature/8` aberta contra `main`.

### Passo a Passo

1. Acesse a Pull Request da branch `feature/8`.
2. Confirme que o arquivo `.github/workflows/ci.yml` foi incluído na PR.
3. Na aba **Checks** ou **Actions**, localize o workflow **Web CI** acionado por `pull_request`.
4. Abra o job `test` e valide a ordem dos steps:
   1. `actions/checkout@v4`
   2. `actions/setup-node@v4` com Node 20 e cache npm
   3. `npm ci`
   4. `npm run lint`
   5. `npx tsc -b`
   6. `npm test -- --run --coverage`
5. Confirme que o check conclui com sucesso antes do merge.

### Casos de Borda

- Alterar um teste para falhar deve deixar o step de testes vermelho e bloquear o merge.
- Introduzir erro TypeScript deve falhar no step `npx tsc -b`.
- Introduzir erro de lint deve falhar no step `npm run lint`.

---

## 7. DOD

- [x] Código/configuração implementado e compilando.
- [x] Teste estrutural escrito e passando via suíte Vitest.
- [x] Lint sem erros.
- [x] Coverage acima de 90%.
- [x] Build de produção executado com sucesso.
- [x] Pre-commit hook existente verificado em `.githooks/pre-commit`.
- [x] Evidências capturadas.
- [x] Passo a passo de validação humana escrito.
- [x] PR aberta contra `main` (#12).
- [ ] GitHub Project atualizado para revisão.

---

## 8. Fix pós-review (Codex Review, PR #12)

Achado P2 do Codex: workflow sem bloco `permissions`, rodando com token padrão (read/write) em vez de least-privilege.

Teste adicionado em `src/ci-config.test.ts` (Red → Green):

```text
✓ should restrict the workflow token to read-only contents (least privilege)
```

`.github/workflows/ci.yml` passou a declarar:

```yaml
permissions:
  contents: read
```

Verificação local pós-fix:

```bash
npx vitest run src/ci-config.test.ts   # 6 passed (6)
npm run lint                            # exit 0 (só warnings preexistentes em AuthContext.tsx)
npm run coverage                        # 96.37% statements, exit 0
npm run build                           # tsc -b && vite build — exit 0
```

---

## 9. Fix pós-review (Codex Review, 2ª rodada, commit `935db7b`)

Achado P1 do Codex: o CI parava em `npx tsc -b` (só typecheck), sem rodar o bundler Vite/Rollup — uma quebra exclusiva do build (ex.: `index.html`, assets, plugins) passaria no CI e só falharia no deploy.

Testes ajustados/adicionados em `src/ci-config.test.ts` (Red → Green):

```text
✓ should run all required validation steps: npm ci, lint, production build, and test with coverage
✓ should run the real Vite production build instead of a standalone typecheck
```

`.github/workflows/ci.yml` passou a rodar `npm run build` (`tsc -b && vite build`) no lugar de `npx tsc -b`.

Verificação local pós-fix:

```bash
npx vitest run src/ci-config.test.ts   # 7 passed (7)
npm run lint                            # exit 0 (só warnings preexistentes em AuthContext.tsx)
npm run coverage                        # exit 0
npm run build                           # tsc -b && vite build — exit 0
```
