# Log de Decisões — Issue #8 — Pipeline CI GitHub Actions

## DOR → SPEC — 2026-08-29

- Decisão: tratar a issue GitHub #8 como unidade independente de entrega em branch `feature/8` porque os arquivos impactados são isoláveis dos demais itens Ready.
- Decisão: manter o escopo restrito ao frontend `cartola-insights-web`; alterações externas ficam como validação/evidência, não como pré-requisito bloqueante local.
- Risco aceito: tarefas paralelas podem tocar arquivos comuns (`package.json`, configs); mitigação é worktree separado por issue e PRs pequenos contra `main`.

## SPEC → PROMPT PLAN — 2026-08-29

- Decisão: decompor a execução em TDD por critério de aceite, depois implementação mínima e evidências, para preservar Red → Green → Refactor.
- Decisão: usar os comandos reais do `package.json` nesta sessão porque `.claude/skills/` ainda não está carregado como skill local pelo runtime atual.
- Risco aceito: validações externas como GitHub Actions/Vercel podem exigir evidência posterior ao push/PR.

## PROMPT PLAN → TDD — 2026-08-29

- Decisão: validar o workflow por teste estrutural de arquivo em vez de dependência YAML adicional, mantendo a issue sem novas bibliotecas de parsing.
- Decisão: criar o teste em `src/ci-config.test.ts` com ambiente Node para ler `.github/workflows/ci.yml` diretamente.
- Risco aceito: teste textual não valida todo o schema do GitHub Actions, mas cobre os contratos obrigatórios da issue.

## TDD → BUILD — 2026-08-29

- Decisão: incluir `node` em `tsconfig.app.json` porque o teste de contrato usa imports `node:fs` e `node:path` dentro do projeto TypeScript existente.
- Decisão: manter o workflow com comandos explícitos (`npm ci`, lint, typecheck e coverage) em vez de encapsular scripts novos, deixando o CI fácil de auditar no GitHub.
- Risco aceito: o ambiente local desta sessão exige `NODE_ENV=test` para Vitest/React Testing Library, enquanto o Actions roda em ambiente limpo sem essa variável global.

## BUILD → EVIDÊNCIAS — 2026-08-29

- Decisão: registrar warnings preexistentes do oxlint como evidência não-bloqueante porque o comando retorna exit code 0 e a issue não altera `AuthContext.tsx`.
- Decisão: documentar o hook `.githooks/pre-commit` existente como compatível com a sequência lint → coverage → build.
- Risco aceito: a evidência da execução remota do GitHub Actions só fica disponível após push e criação da PR.

## PR REVIEW (Codex) → FIX — 2026-08-29

- Decisão: aplicar `permissions: contents: read` no nível do workflow em resposta ao achado P2 do Codex Review na PR #12 — RNF02 ("Permissões mínimas quando aplicável") já estava escrito no spec original mas não tinha sido implementado.
- Decisão: cobrir a permissão com teste estrutural adicional em `src/ci-config.test.ts` (Red → Green) em vez de confiar só em revisão manual do YAML.
- Risco aceito: nenhum — mudança restringe permissões sem afetar os steps existentes (checkout, setup-node, lint, tsc, test não precisam de escrita no repositório).

## PR REVIEW (Codex, 2ª rodada) → FIX — 2026-08-29

- Decisão: substituir o step `npx tsc -b` por `npm run build` (`tsc -b && vite build`) em resposta ao achado P1 do Codex Review no commit `935db7b` — o step antigo não rodava o bundler Vite/Rollup, então uma quebra exclusiva do build (ex.: `index.html`, assets, plugins) passaria no CI e só falharia no deploy.
- Decisão: manter um único step de build cobrindo typecheck + bundle em vez de dois steps redundantes, já que `npm run build` já inclui `tsc -b`.
- Risco aceito: nenhum — o novo step é estritamente mais abrangente que o anterior (mesmo typecheck, mais a validação do bundler).

## PR REVIEW (Codex, 3ª rodada) → FIX — 2026-08-29

- Decisão: remover `NODE_ENV: test` do nível do job e aplicá-lo apenas inline no step de testes (`run: NODE_ENV=test npm test -- --run --coverage`), em resposta ao achado P1 no commit `78b9754` — o valor no nível do job vazava pro step `npm run build`, e Vite trata `NODE_ENV`/`mode` de forma independente, então o build em CI não exercitava branches `import.meta.env.PROD` reais.
- Decisão: corrigir as seções 4 e 6 de `docs/evidence/issue-8-ci-github-actions.md` diretamente (não só anexar nota), em resposta ao achado P2 — o guia de validação humana precisa refletir os steps reais do workflow para ser útil.
- Risco aceito: nenhum — `npm ci` e `npm run build` agora rodam com o `NODE_ENV` real do runner, mais próximo do ambiente de deploy da Vercel.
