# Evidências — Issue #11: Mutation Testing no Frontend com Stryker Mutator

Data: 2026-09-13

## Resumo da Feature

Mutation testing configurado no frontend `cartola-insights-web` com Stryker Mutator + runner do Vitest:

- `@stryker-mutator/core` e `@stryker-mutator/vitest-runner` (10.0.0) como devDependencies.
- `stryker.config.json`: `testRunner: vitest`, `coverageAnalysis: perTest`, `concurrency: 4`, `mutate` cobrindo `src/**/*.{ts,tsx}` exceto testes e entry points (`src/main.tsx`, `src/vite-env.d.ts`, `src/setupTests.ts`), `thresholds.break: 90`, reporters `html` + `clear-text` + `progress`.
- Script `npm run test:mutation` (`stryker run`).
- CI (`.github/workflows/ci.yml`) roda `npm run test:mutation` como step bloqueante após lint/build/coverage, e publica o relatório HTML como artefato (`actions/upload-artifact@v4`, 14 dias de retenção).
- Node bumpado de 20 → 24 no CI (exigência de `engines.node >= 22` do `@stryker-mutator/core`).
- Suíte de testes reforçada em 38 arquivos (6 novos arquivos de teste + 32 reforçados) para elevar o mutation score de um baseline de **66,52%** para **96,23%**, acima da meta de 90%.

---

## 1. Baseline (antes do reforço de testes)

Comando executado (config inicial, threshold 90%):

```bash
NODE_ENV=test npx stryker run
```

Resultado:

```text
All files                  |  66.52 |   68.56 |     1655 |        22 |        769 |       75 |        0 |
...
Final mutation score 66.52 under breaking threshold 90, setting exit code to 1 (failure).
```

37 arquivos com mutantes sobreviventes/não cobertos foram identificados (844 mutantes "ruins" no total), incluindo componentes sem nenhum teste dedicado (`PositionChips.tsx` 0%, `SortableHeader.tsx`, `HeadToHeadTable.tsx`, `BlocosComparacao.tsx`, `MandoRodada.tsx`, `pentagonoGeometria.ts`).

---

## 2. Reforço da suíte

Cada um dos 37 arquivos foi processado (em paralelo, por subagentes independentes, um por arquivo) seguindo um playbook comum:

- Nunca alterar código de produção, salvo bug real comprovado (nenhum foi encontrado).
- Nunca enfraquecer mutantes via exclusão de config — apenas reforçar asserts (valor exato em vez de "está definido"/"não é vazio").
- Documentar mutantes genuinamente equivalentes (sem efeito observável via Testing Library) em vez de escondê-los.
- Validar com `npx vitest run <arquivo>` antes de encerrar.

Resultado: 9 commits de reforço (`lote 1` a `lote 9`), **38 arquivos de teste alterados** (32 reforçados + 6 novos), **4331 linhas adicionadas**. A suíte cresceu de 300 para **508 testes**, e a cobertura de linhas subiu de 97,38% para **100%** (statements 96,52% → 99,89%, branches 91,22% → 97,38%).

Padrões de mutante equivalente mais recorrentes (documentados pelos subagentes, não excluídos da config):

- Guarda `ativo`/cleanup de `useEffect` contra `setState` pós-desmonte — o React 19 não emite mais warning nesse cenário, sem efeito observável via testes de componente.
- `useEffect(fn, [])` vs `useEffect(fn, ["Stryker was here"])` — comparação de dependências do React é por valor (`Object.is`), então um literal constante nunca força re-execução.
- Comparações redundantes com `undefined`/`null` em expressões que já são inalcançáveis por outra via (ex.: tipos que nunca produzem aquele valor em runtime).

---

## 3. Run final do Stryker (com a suíte reforçada)

Comando executado:

```bash
NODE_ENV=test npx stryker run
```

Resultado (resumo por diretório):

```text
                           | % Mutation score |          |           |            |          |          |
File                       |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
---------------------------|--------|---------|----------|-----------|------------|----------|----------|
All files                  |  96.23 |   96.23 |     2423 |         1 |         95 |        0 |        2 |
 api                       | 100.00 |  100.00 |      167 |         1 |          0 |        0 |        0 |
 components                |  97.21 |   97.21 |     1079 |         0 |         31 |        0 |        0 |
 contexts                  |  86.36 |   86.36 |       19 |         0 |          3 |        0 |        0 |
 hooks                     |  96.23 |   96.23 |       51 |         0 |          2 |        0 |        0 |
 pages                     |  95.04 |   95.04 |     1054 |         0 |         55 |        0 |        2 |
 utils                     |  92.45 |   92.45 |       49 |         0 |          4 |        0 |        0 |
 App.tsx                   | 100.00 |  100.00 |        4 |         0 |          0 |        0 |        0 |
---------------------------|--------|---------|----------|-----------|------------|----------|----------|

Final mutation score of 96.23 is greater than or equal to break threshold 90
Your report can be found at: file:///…/reports/mutation/html/index.html
Done in 23 minutes and 19 seconds.
```

Exit code 0 — gate passa.

### Sobre os 95 mutantes sobreviventes remanescentes

A maioria são variações do mesmo punhado de padrões equivalentes já documentados no item 2 (ex.: `formatNumber.ts` tem 4 sobreviventes de `'pt-BR'` → `''` no locale do `Intl.NumberFormat` — o ambiente de testes usa uma build de ICU onde locale vazio cai em fallback silencioso em vez de lançar erro, então o valor formatado observável não diverge o suficiente para todos os casos de teste escritos). Como o score já está 6,23 pontos acima da meta e a issue explicitamente coloca fora de escopo "ajustar toda a suíte de testes para perseguir mutantes sobreviventes fora do necessário para atingir o gate inicial", não foram perseguidos mais a fundo.

### Sobre os 2 `RuntimeError` em `MinhaConta.tsx`

Os mutantes 2372/2374 (condição `tokenGerado && navigator.clipboard`) fazem o worker do Stryker/Vitest crashar com `TypeError: Cannot convert object to primitive value` ao tentar serializar o erro do teste que usa `navigator.clipboard` mockado. É uma limitação pontual da combinação Stryker+Vitest+mock de API do browser nesse teste específico, não um bug de produção — e não conta contra o mutation score (Stryker exclui `RuntimeError` do denominador, como faz com `Timeout`).

---

## 4. Testes, lint e build (skills do projeto)

```bash
npm run lint      # exit 0 — apenas 2 warnings preexistentes em AuthContext.tsx, fora do escopo desta issue
npm run coverage  # exit 0 — 48 arquivos, 508 testes, 100% lines/functions
npm run build     # exit 0 — tsc -b && vite build
```

Resumo do `npm run coverage`:

```text
Test Files  48 passed (48)
     Tests  508 passed (508)

Statements   : 99.89% ( 953/954 )
Branches     : 97.38% ( 670/688 )
Functions    : 100% ( 344/344 )
Lines        : 100% ( 846/846 )
```

---

## 5. Exclusões da mutação e justificativa (RF07 / CA04)

Apenas exclusões de entry point/infraestrutura de teste, sem lógica de produto:

| Padrão excluído | Justificativa |
|---|---|
| `src/main.tsx` | Bootstrap do React (`createRoot().render`), sem branch lógico testável; já excluído do coverage do Vitest pelo mesmo motivo. |
| `src/vite-env.d.ts` | Apenas declaração de tipos, sem código executável. |
| `src/setupTests.ts` | Configuração do ambiente de teste (polyfills/matchers), não é lógica de produto. |
| `src/**/*.test.{ts,tsx}` | Os próprios arquivos de teste nunca são alvo de mutação (padrão do Stryker). |

Nenhuma outra pasta ou arquivo foi excluído — API clients, hooks, componentes, páginas e utilitários de formatação estão todos no escopo de mutação.

---

## 6. Guia de Validação Humana

### Pré-requisitos

- [ ] Node 24 instalado localmente (ou `nvm use 24`).
- [ ] `npm ci` executado no diretório do frontend.

### Passo a Passo

1. Rode `npm run test:mutation` na raiz do frontend.
2. Aguarde a execução completa (~20-25 min nesta máquina; pode variar por hardware).
3. Confirme que o terminal mostra `Final mutation score ... is greater than or equal to break threshold 90` e exit code 0.
4. Abra `reports/mutation/html/index.html` no navegador e explore o relatório por arquivo/mutante.
5. Na PR, confira que o job **Web CI** no GitHub Actions executa o step `NODE_ENV=test npm run test:mutation` e publica o artefato `mutation-report`.

### Casos de Borda

- Reduzir `thresholds.break` no `stryker.config.json` para um valor artificialmente baixo (ex.: `0`) e rodar `npm run test:mutation` deve passar mesmo com poucos mutantes mortos — confirma que o exit code depende do threshold, não de um valor fixo hardcoded.
- Deletar um assert de um teste existente (ex.: em `PositionChips.test.tsx`) e rodar `npx stryker run --mutate "src/components/PositionChips.tsx"` deve fazer pelo menos um mutante antes morto voltar a sobreviver — confirma que a suíte reforçada realmente depende dos asserts adicionados, não de coincidência.
- Rodar `npm test` (Vitest puro, sem Stryker) continua funcionando normalmente e independente da execução de mutação (CA06).

---

## 7. DOD

- [x] Dependências do Stryker e runner do Vitest adicionadas ao frontend.
- [x] Configuração do Stryker criada com score mínimo de 90% (`thresholds.break: 90`).
- [x] Script local de mutation testing adicionado ao `package.json` (`npm run test:mutation`).
- [x] CI atualizado para executar mutation testing e bloquear PR abaixo da meta.
- [x] Relatório HTML gerado localmente (`reports/mutation/html/index.html`) e publicado como artefato do CI.
- [x] Exclusões documentadas e justificadas (seção 5).
- [x] Testes, lint e build do frontend passando.
- [x] Evidência do mutation score e do relatório anexada ao PR (este documento).
