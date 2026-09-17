# Log de Decisões — Issue #11 — Mutation Testing no Frontend com Stryker Mutator

## DOR → SPEC — 2026-09-13

- Decisão: execução autônoma disparada pelo board (sem aprovação interativa de checkpoint); ambiguidades do refinamento são resolvidas com a suposição mais razoável e registradas aqui, sem pausar por resposta.
- Decisão: `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` na major mais recente (10.0.0) porque exige apenas `vitest >=2.0.0` (o projeto usa `^4.1.11`) e `node >=22` (ambiente usa Node 24) — sem downgrade de dependências existentes.
- Risco aceito: mutation testing completo do frontend pode ser lento no CI; RNF05 já prevê abrir follow-up de otimização (ex.: `incremental`, sharding) sem afetar o gate bloqueante inicial.

## SPEC → PROMPT PLAN — 2026-09-13

- Decisão: nesta entrega de tooling não há lógica de produto nova para aplicar Red → Green → Refactor; a validação "TDD" desta issue é o próprio ciclo rodar Stryker → ver mutantes sobreviventes → reforçar teste existente → mutante morto, até atingir a meta de 90%.
- Decisão: excluir da mutação apenas arquivos sem lógica executável relevante (`src/main.tsx`, `src/vite-env.d.ts`, `src/setupTests.ts`) e os próprios arquivos de teste — mesmo padrão já usado no `coverage.exclude` do `vitest.config.ts`, evitando dois critérios divergentes de escopo.
- Risco aceito: caso sobrem mutantes genuinamente não-acionáveis (equivalentes), serão documentados como `ignore` pontual no PR, nunca como exclusão de arquivo inteiro, para não mascarar score artificialmente (RNF04).

## PROMPT PLAN → TDD/BUILD — 2026-09-13

- Decisão: o baseline (config inicial + `npm run test:mutation`) revelou score de 66,52% — bem abaixo dos 90% exigidos (RF03/CA02). Em vez de abrir exceção ou reduzir escopo, segui o risco já aceito no spec ("o gate pode revelar lacunas reais na suíte atual e exigir reforço de testes antes do PR ficar verde") e despachei subagentes paralelos, um por arquivo, para reforçar/ criar testes com asserts de valor exato (não apenas presença/truthy) até matar os mutantes sobreviventes reais.
- Decisão: cada subagente seguiu um playbook comum (documentado em memória de sessão) proibindo alterar código de produção salvo bug real comprovado, proibindo enfraquecer mutantes via exclusão na config, e exigindo `npx vitest run <arquivo>` verde antes de encerrar — garantindo que o reforço da suíte não vira "gaming" do score.
- Decisão: mutantes genuinamente equivalentes (ex.: guarda `ativo`/cleanup de `useEffect` contra `setState` pós-unmount — o React 19 não emite mais warning nesse caso, então não há efeito observável via Testing Library; ou array de deps `[]` vs `[literal-constante]`, comportamentalmente idênticos por `Object.is`) foram documentados nos relatórios de cada subagente, mas **não** viraram `Stryker disable`/exclusão de config — ficam apenas como sobreviventes aceitos dentro da margem acima de 90%, preservando RNF04.

## BUILD → EVIDÊNCIAS — 2026-09-13

- Decisão: score final de 96,23% (rodando `npm run test:mutation` completo), confortavelmente acima do threshold de 90% — não foi necessário perseguir os ~95 mutantes sobreviventes remanescentes (a maioria já são os equivalentes documentados acima), respeitando o "Fora de Escopo" do spec ("ajustar toda a suíte para perseguir sobreviventes fora do necessário para atingir o gate inicial").
- Decisão: bump de `node-version: 20` → `24` no CI (`@stryker-mutator/core` exige `engines.node >= 22`) e `concurrency: 4` fixado no `stryker.config.json` (evita picos de memória em máquinas com menos RAM disponível, RNF02) — ambos validados localmente antes do commit.
- Risco aceito: 2 mutantes em `MinhaConta.tsx` (linha do `navigator.clipboard`) terminam como `RuntimeError` do próprio test-runner do Stryker — não contam contra o score (excluídos do denominador, como `Timeout`), limitação conhecida da combinação Stryker+Vitest+mock de `navigator.clipboard`, não um bug de produto (detalhes em `docs/evidence/`).

## PR REVIEW (Codex) → FIX — 2026-09-13/14

- Decisão: root cause do primeiro CI vermelho não foi flakiness — `actions/checkout@v4` em eventos `pull_request` faz checkout do merge commit sintético (branch + `main` atual), e a `main` já tinha corrigido (PR #24) o mapeamento Poder de Fogo/Criação em `calcularEixos`; meus testes (escritos antes desse merge) ainda esperavam o comportamento antigo. Corrigido com `git merge origin/main` + ajuste manual dos 4 arquivos de teste que encodavam valores do mapeamento anterior — nunca alterei `pentagonoGeometria.ts`.
- Decisão: `engines.node` apertado de `>=22.12.0` para `^22.18.0 || >=24.11.0` em resposta a 2 achados do Codex — com `engine-strict=true`, o range declarado precisa ser a interseção real de **todos** os pacotes do lockfile (confirmado via `npm help config`), não só do requisito mais permissivo; `@babel/core@8` (transitivo do instrumentador do Stryker) é o gargalo real.
- Decisão: sincronizei a branch novamente com `main` (PR #26, infra e2e Playwright) por ter chegado durante a revisão — conflitos só em arquivos aditivos (`ci.yml`, `package.json`, `.gitignore`, `src/ci-config.test.ts`), resolvidos mantendo ambos os blocos; e2e do Playwright validado apenas pelo próprio CI (sandbox local sem sudo para instalar deps do Chromium).
