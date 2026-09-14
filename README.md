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

Requer **Node.js >= 22.12** (`@stryker-mutator/core`/`@stryker-mutator/vitest-runner`
exigem Node >= 22; o `engines` do `package.json` mais o `.npmrc`
(`engine-strict=true`) fazem `npm install`/`npm ci` falharem cedo em vez de só
avisar em runtimes mais antigos).

```bash
npm install
npm run dev        # dev server em http://localhost:5173
```

O Vite espera a API do backend em `http://localhost:8000` (ajustável pela
variável `VITE_API_BASE_URL`).

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe o dev server do Vite |
| `npm run build` | TypeScript (`tsc -b`) + build de produção |
| `npm run test` | Vitest (rodada única) |
| `npm run coverage` | Vitest com cobertura (piso de 90% em statements/branches/functions/lines) |
| `npm run lint` | Oxlint |
| `npm run test:mutation` | Mutation testing (Stryker Mutator + runner do Vitest; piso de 90% de mutation score) |

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