# Spec: Issue #6 — Infraestrutura de Testes de Regressão Visual com Playwright

## Contexto de Negócio

Os próximos refinamentos do frontend vão mexer em tipografia, tabelas, cards e leitura visual. Antes de evoluir para comparação pixel a pixel completa, o projeto precisa de uma infraestrutura inicial de Playwright que rode no CI e detecte quebras visuais ou de renderização óbvias — antes que cheguem a produção.

## Requisitos Funcionais

- RF01: configurar Playwright no frontend.
- RF02: adicionar script no `package.json` para executar os testes visuais/e2e iniciais.
- RF03: criar teste para a Listagem de Jogadores em viewport desktop.
- RF04: criar teste para a Listagem de Jogadores em viewport mobile.
- RF05: o teste deve falhar se a página não carregar, se houver erro crítico de JavaScript, se a UI principal não renderizar ou se o screenshot capturado estiver vazio/quebrado.
- RF06: integrar o comando ao CI como gate bloqueante de PR.
- RF07: publicar artefato útil de falha quando aplicável (relatório HTML do Playwright, trace, screenshot).

## Requisitos Não-Funcionais

- RNF01: manter a configuração inicial simples e estável.
- RNF02: evitar testes frágeis dependentes de comparação pixel a pixel nesta etapa.
- RNF03: não exigir baseline versionada no repositório.
- RNF04: testes devem ser reproduzíveis localmente.
- RNF05: dados de teste devem ser controlados (fixture/mock local) para evitar flakiness ligada a backend real.

## Critérios de Aceite

- CA01: Playwright está configurado no frontend (`@playwright/test` instalado, `playwright.config.ts` criado).
- CA02: existe comando local (`npm run test:e2e`) para rodar a suíte inicial.
- CA03: CI executa a suíte e bloqueia o PR em caso de falha.
- CA04: Listagem de Jogadores é validada em desktop e mobile (dois projetos Playwright com viewports distintos).
- CA05: erro crítico de página/console/renderização quebrada faz o teste falhar (verificado com um cenário induzido — ver Fora de Escopo/evidências).
- CA06: baseline de screenshot versionada e comparação pixel a pixel não são exigidas nesta task.
- CA07: em caso de falha no CI, o relatório HTML do Playwright (e trace/screenshot quando existir) fica disponível como artefato do job.

## Definition of Done

- [ ] Playwright instalado/configurado no frontend.
- [ ] Script local de execução adicionado ao `package.json`.
- [ ] Teste da Listagem de Jogadores em desktop implementado.
- [ ] Teste da Listagem de Jogadores em mobile implementado.
- [ ] CI configurado para bloquear PR quando a suíte falhar.
- [ ] Relatório/trace/screenshot de falha publicado como artefato do job de CI.
- [ ] Testes, lint e build do frontend passando (skills do projeto).
- [ ] Baseline versionada e comparação pixel a pixel explicitamente fora do escopo.

## Fora de Escopo

- Versionar snapshots de referência (baseline).
- Comparação pixel a pixel (`toHaveScreenshot`/`toMatchSnapshot`).
- Cobrir Detalhe do Atleta, Pentágono de Qualidade ou Raio-X de Confronto.
- Cobrir viewport tablet.
- Pipeline completo de regressão visual com baseline formal.

## Decisões de Refinamento Assumidas (execução não-supervisionada)

Como esta execução é automatizada e não há checkpoint intermediário de esclarecimento, as ambiguidades abaixo foram resolvidas com a opção mais simples e alinhada às decisões já registradas na issue, e ficam documentadas em `docs/decisions/issue-6-testes-visuais-playwright.md`:

- Origem de dados da Listagem de Jogadores no e2e: a página consome `/atletas` (e `/contas/me`, via `AuthContext`) de um backend real (`VITE_API_BASE_URL`, default `http://localhost:8000`). Como não há backend disponível/controlado no CI, os testes interceptam a rede (`page.route`) e respondem com um fixture local fixo — evita dependência de backend real e elimina flakiness (RNF05), sem exigir mudança de código de produção.
- Servidor sob teste: `vite dev` (via `npm run dev`), iniciado automaticamente pelo Playwright (`webServer`) — mantém a infraestrutura simples (RNF01) sem exigir um build de produção prévio.
- Verificação "screenshot vazio/quebrado" (RF05): sem baseline, a checagem é um screenshot full-page cujo buffer deve exceder um tamanho mínimo, combinada com asserções de DOM (linhas da tabela e conteúdo visível) — cobre renderização quebrada sem introduzir comparação pixel a pixel (fora de escopo).
- Viewports: desktop = `1280x800` (Desktop Chrome); mobile = preset `Pixel 5` do Playwright — ambos rodando no engine Chromium para manter a suíte simples e rápida.
