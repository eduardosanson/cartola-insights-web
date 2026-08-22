# Prompt Plan: MVP Web

Spec: `spec.md`. Depende de `../backend`'s Fase 2 (spec-fase2-consulta.md)
já estar rodando (endpoints `/atletas`, `/atletas/{id}/historico`,
`/clubes`).

## Global Constraints

- React + Vite + TypeScript. Testes com Vitest + React Testing Library.
- Cliente de API isolado em `src/api/` — componentes nunca chamam
  `fetch` direto.
- Código não-verboso, componentes pequenos, um arquivo por
  responsabilidade. Documentar depois de implementar.
- Identidade visual da POC: verde-turfe (`--accent-home`) pra casa,
  ocre (`--accent-away`) pra fora, Barlow Condensed (títulos/labels) +
  Karla (corpo) + JetBrains Mono (números/dados) via Google Fonts.
- Sem dado mockado fora dos testes — os testes usam um cliente HTTP
  mockado (`msw` ou fetch mock simples, escolha do implementador,
  documentar), a aplicação real sempre chama a API de verdade.

## Task 1: Esqueleto do projeto

`npm create vite@latest . -- --template react-ts`, configurar Vitest +
Testing Library, ESLint, variável de ambiente `VITE_API_BASE_URL`
(default `http://localhost:8000`). Um teste smoke (`App` renderiza sem
quebrar) + `src/api/client.ts` com uma função `apiGet<T>(path)` que já
trata erro de rede/status não-2xx de forma explícita (não engole).
Tema (tokens CSS: cores, fontes) em `src/theme.css`, carregado global.

## Task 2: Cliente de API tipado

Testes (mock de `fetch`) + implementação de `src/api/atletas.ts`
(`listarAtletas(filtros)`, `buscarHistoricoAtleta(id)`) e
`src/api/clubes.ts` (`listarClubes()`), com os tipos TypeScript das
respostas espelhando exatamente o schema Pydantic do backend (ver
`../backend/app/contexts/estatisticas/api/`).

## Task 3: Tela "Tabela do campeonato"

Testes (Testing Library, API mockada) + componente `src/pages/Tabela.tsx`
— lista de clubes com média casa/fora, estado de loading/erro.

## Task 4: Tela "Jogadores" (lista + busca + filtro)

Testes + componente `src/pages/Jogadores.tsx` — campo de busca por
nome, filtro por posição (chips, mesma UX da POC), lista paginada.
Debounce na busca (300ms) pra não disparar uma requisição por tecla.

## Task 5: Tela "Detalhe do jogador"

Testes + componente `src/pages/DetalheJogador.tsx` — médias +
histórico de pontuação com scouts, navegação a partir de um clique na
lista de jogadores (roteamento: `react-router` ou estado local simples,
escolha do implementador dado o tamanho do app — 3 telas não
necessariamente precisam de um router completo, documentar a decisão).

O detalhe deve consultar `GET /atletas/{id}` para os dados resumidos e
`GET /atletas/{id}/historico` para as pontuações. O acesso direto e o refresh
não podem depender de `location.state`.

## Task 5.1: Ordenacao multipla e formatacao numerica

RED: testes do formatador, do estado de ordenacao e das telas cobrindo os ciclos
descendente/ascendente/removido, combinacao por prioridade e valores com mais de
duas casas. GREEN: criar utilitario de formatacao, hook de ordenacao e cabecalho
ordenavel reutilizavel; integrar em Tabela, Jogadores e DetalheJogador.

## Task 5.2: Mando do atleta na rodada atual

RED: atualizar tipos e testes das telas para `rodada_atual` e `mando_rodada`,
cobrindo casa, fora e sem jogo. GREEN: incluir a coluna Mando em Jogadores e o
resumo da rodada em DetalheJogador, usando as cores de casa/fora existentes.

## Task 6: Evidências, PR

Suíte completa + cobertura, lint, `vite build`. Rodar contra o backend
real localmente e capturar evidência (descrição + validação manual das
3 telas com dado real). `docs/evidence/mvp-web.md`. Commit final, merge
em `main`.

## Riscos

- Backend da Fase 2 (endpoints novos) precisa estar pronto antes da
  Task 2 — coordenar timing com a execução do backend.
- CORS: rodando `npm run dev` (porta 5173 por padrão) contra a API em
  `localhost:8000` vai precisar de CORS liberado pra `localhost:5173`
  em dev — isso é uma exceção de desenvolvimento, não contradiz RF09
  (sem exposição pública) porque é loopback-only; documentar a decisão
  no backend se for necessário adicionar `CORSMiddleware` com allowlist
  de `http://localhost:5173`.
