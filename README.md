# Cartola Insights — Web

Frontend do Cartola Insights: visualização de jogadores, times e tabela do
Campeonato Brasileiro, com o radar de atributos por jogador, telas de conta
(registro, login e API tokens) e a identidade visual da POC original.

Consome a API do repositório
[`cartola-insights-backend`](https://github.com/eduardosanson/cartola-insights-backend)
(local em `http://localhost:8000` durante o desenvolvimento).

## Produção

A aplicação está publicada na Vercel em
[`cartola-insights-web.vercel.app`](https://cartola-insights-web.vercel.app).
O projeto está conectado a este repositório e novos commits na branch `main`
geram deployments de produção automaticamente.

## Stack

TypeScript 6 · React 19 · Vite 8 · react-router-dom · Vitest + React Testing
Library · Oxlint

## Como rodar

Requer **Node.js `^22.18.0` ou `>=24.11.0`** (ex.: 22.18+, 22.20, 24.11, 24.20…;
**não** cobre 22.12–22.17, 23.x nem 24.0–24.10). A restrição real vem do
`@babel/core` 8 travado no lockfile (dependência do instrumentador do
Stryker), mais estrito que o `@stryker-mutator/core`/`vitest-runner`
(Node >= 22) e o próprio Vitest 4 (que também exclui Node 23.x). O `engines`
do `package.json` reflete essa interseção, e o `.npmrc` (`engine-strict=true`)
faz `npm install`/`npm ci` falharem cedo em runtime incompatível — de
qualquer pacote do lockfile, não só do projeto — em vez de só avisar.

```bash
npm install
npm run dev        # dev server em http://localhost:5173
```

O frontend se comunica com a API via proxy no mesmo domínio (`/api/proxy/*`).
Em desenvolvimento local, o Vite encaminha `/api/proxy/*` para o backend em
`http://localhost:8000` (configurável via variável `BACKEND_ORIGIN` no ambiente
do dev server), removendo o prefixo `/api/proxy`. Em produção/preview na Vercel,
o tráfego de `/api/proxy/*` é atendido pela função serverless
(`api/proxy/[...path].ts`), que injeta a credencial `SERVICE_TOKEN` no servidor
sem expô-la ao navegador.

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe o dev server do Vite |
| `npm run build` | TypeScript (`tsc -b`) + build de produção |
| `npm run test` | Vitest (rodada única) |
| `npm run coverage` | Vitest com cobertura (piso de 90% em statements/branches/functions/lines) |
| `npm run lint` | Oxlint |
| `npm run test:mutation` | Mutation testing (Stryker Mutator + runner do Vitest; piso de 90% de mutation score) |

## Gate manual pré-merge (`pre-merge-manual`)

O workflow `.github/workflows/pre-merge-manual.yml` (`workflow_dispatch`) valida um
PR sob demanda e publica o commit status `pre-merge-manual` no SHA do PR.

Como disparar: aba **Actions → Pre-merge manual → Run workflow** (informe o número
do PR) ou `gh workflow run pre-merge-manual.yml -f pr_number=<N>`.

O que valida: `npm ci`, `npm run lint`, `npm run build` (inclui `tsc -b`),
`npm test -- --run` e `npm run test:e2e` (Playwright local, chromium). O status
vai de `pending` para `success` ou `failure`, com link para a execução. Fica de
fora o mutation testing (roda no CI) e o E2E contra o preview da Vercel.

Só aceita PR aberto do próprio repositório (aborta se fechado ou de fork). Disparos
repetidos para o mesmo PR cancelam o anterior; só o mais recente publica o status final.
O workflow só aparece na interface depois de existir na `main`.

## Ambiente: `NODE_ENV` e os testes

Se o ambiente já exporta `NODE_ENV=production`, o Vitest respeita esse valor e
o React 19 carrega o build de produção de `react-dom/test-utils`, onde `act`
não existe — os testes quebram com `TypeError: React.act is not a function`.

Para rodar testes/build/lint de forma confiável, force `NODE_ENV=test`:

```bash
NODE_ENV=test npm test
NODE_ENV=test npm run coverage
NODE_ENV=test npm run build
```

Isso não é necessário num shell limpo (onde o Vitest normalmente assume
`NODE_ENV=test` sozinho), só quando a variável já vem definida como
`production` de processos pai (ex.: alguns agentes/CI).

## Estrutura

```
src/
├── api/          # clientes HTTP por domínio (atletas, clubes, contas, percentis)
├── components/   # componentes reutilizáveis (Nav, RadarAtributos, MandoRodada, …)
├── contexts/     # estado global (AuthContext)
├── hooks/        # custom hooks (useMultiSort)
├── pages/        # telas (Tabela, Jogadores, DetalheJogador, Login, Registro, MinhaConta)
└── utils/        # helpers (formatNumber)

docs/
├── specs/        # especificações (spec-*.md)
├── plans/        # planos de implementação (prompt_plan-*.md)
├── decisions/    # log de decisões por fase
└── evidence/     # evidências e DOD de cada entrega
```

Documentos de planejamento ficam em `docs/`, não na raiz do repositório.

## Regras de desenvolvimento

Ver [`AGENTS.md`](AGENTS.md) — TDD, cobertura ≥ 90% e o fluxo global de
`~/.codex/AGENTS.md`.