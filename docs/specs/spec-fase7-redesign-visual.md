# Spec: Fase 7 — Redesign Visual (reaproveitando a POC)

## Contexto de Negócio

A identidade visual da POC original (cor, tipografia) já tinha sido
reaproveitada desde o MVP (`spec.md` RF05), mas a linguagem de
layout — cards, painéis, listas em grid — nunca foi. Esta fase fecha
essa lacuna em duas partes: uma primeira sessão aplicou CSS genérico de
card/painel em cima do HTML semântico existente (`theme.css`, commit
`26fc587`); esta parte completa o que ficou fora do escopo por limite de
contexto: o layout de card-por-linha da lista de jogadores e os painéis
`split-bars`/`matchup-cols` específicos da POC (perfil casa/fora do
jogador e raio-x de confronto).

A POC de referência não está no repositório — foi recuperada do
artifact "Cartola Insights" publicado em 2026-08-22
(`https://claude.ai/code/artifact/b6ddc0b9-f1d9-4375-a18a-c4ed3b767e8f`).

## Requisitos Funcionais

- RF01: A lista de jogadores (`Jogadores.tsx`) vira um card único
  (`players-list-card`) com linhas em CSS grid — cada linha é um link
  inteiro pro detalhe do jogador (`role="row"`), não só o nome, mesmo
  padrão `player-row` da POC.
- RF02: Média casa/fora do jogador (cabeçalho de `DetalheJogador`) vira
  duas barras horizontais (`SplitBars`, componente novo) escaladas pelo
  maior dos dois valores, em vez de texto puro em `<dl>`.
- RF03: O raio-x de confronto (`RaioXConfronto`) vira 3 blocos em grid
  (`matchup-cols`): média do jogador no mando, quanto o adversário cede
  na posição, e o veredito (badge colorido por tom) + participação no
  time.
- RF04: O badge de veredito usa um tom por classificação —
  `referencia_do_time` → positivo (verde), `contribuicao_dividida` →
  neutro, `pontuacao_diluida` → negativo (vermelho/laranja) — mapeado
  dos limiares já calculados em `veredito.py` (backend), não
  recalculado no cliente.
- RF05: "Chance de pontuar" na lista (Fase 6) ganha um badge colorido
  (baixa/média/alta) em vez de texto puro, mesma lógica de cor.

## Requisitos Não-Funcionais

- RNF01: Nenhum campo/dado novo — só reapresentação visual de dados já
  expostos pela API (Fases 3d/3e/6).
- RNF02: Acessibilidade preservada — linhas viram `<Link>` com
  `role="row"`/`role="cell"` explícitos (padrão de "grid acessível"),
  navegáveis por teclado, sem perder a semântica de tabela pra leitor
  de tela.
- RNF03: Testes ≥ 90% de cobertura nos arquivos tocados.

## Critérios de Aceite

- CA01: Cada linha da lista de jogadores é focável por Tab e tem
  `href` pro detalhe do atleta (não só o nome).
- CA02: `SplitBars` escala a barra maior pra 100% de largura e a menor
  proporcionalmente; com os dois valores em 0, nenhuma barra quebra
  (não divide por zero).
- CA03: O badge de veredito muda de classe CSS (`tone-positivo`/
  `tone-neutro`/`tone-negativo`) conforme o veredito recebido.
- CA04: Toda a suíte de testes existente (105 testes antes desta fase)
  continua passando sem alteração de comportamento, só de estrutura
  visual.

## Definition of Done (DOD)

- [x] Código implementado e compilando
- [x] Testes escritos e passando, cobertura ≥ 90%
- [x] Lint sem erros
- [x] Evidências capturadas (`docs/evidence/fase7-redesign-visual.md`)
- [x] Passo a passo de validação humana escrito
- [x] Integrado em `main`

## Fora de Escopo

- Crest/logo colorido por clube (a POC usa cores fictícias por clube;
  não temos essa cor no modelo de dados real).
- Redesign da tela de tabela/classificação (`Tabela.tsx`) — fora do
  pedido original, que citava só lista de jogadores e raio-x.
- Nova paleta ou tipografia — reaproveita os tokens já existentes em
  `theme.css`.
