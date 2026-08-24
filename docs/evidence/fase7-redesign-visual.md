# Evidências — Fase 7 (parte 2): Redesign Visual

Data: 2026-08-23

## Resumo da Feature

Completa o que ficou fora do escopo do commit `26fc587` (CSS genérico
de card/painel): a lista de jogadores vira um card com linhas em grid
totalmente clicáveis (`players-list-card`/`player-row`), o cabeçalho do
jogador ganha `SplitBars` (barras casa/fora), e o raio-x de confronto
vira 3 blocos em grid (`matchup-cols`) com badge de veredito colorido
por tom — tudo reproduzindo a POC original recuperada do Artifact
"Cartola Insights" (22/08).

## TDD

1. **Lista de jogadores**: RED — `renders each player row as a single
   link to the detail page, not just the name` (falhou com `href` nulo,
   linha só tinha `<Link>` no nome). GREEN — linha inteira virou
   `<Link role="row">`; `SortableHeader` ganhou prop `as` pra renderizar
   `<div role="columnheader">` em vez de `<th>` fora de tabela.
2. **`SplitBars`** (componente novo): RED — módulo inexistente (3
   testes: rótulos+valores formatados, escala relativa ao maior valor,
   não quebra com os dois em zero). GREEN — componente com
   `Math.max(mediaCasa, mediaFora, 1)` como divisor (evita divisão por
   zero).
3. **`RaioXConfronto`**: RED — `usa um tom diferente de badge por
   veredito` (classe `tone-*` inexistente). GREEN — `<dl>` trocado por
   `<ul className="matchup-cols">` de 3 `<li className="matchup-block">`,
   badge com classe `tone-${TOM_VEREDITO[veredito]}`.

## Arquivos Criados e Modificados

```text
Novos:
  src/components/SplitBars.tsx
  src/components/SplitBars.test.tsx
  docs/specs/spec-fase7-redesign-visual.md
  docs/decisions/fase7-redesign-visual.md
  docs/evidence/fase7-redesign-visual.md

Modificados:
  src/pages/Jogadores.tsx           (table → players-list-card/player-row)
  src/pages/Jogadores.test.tsx      (+1 teste: linha inteira é link)
  src/pages/DetalheJogador.tsx      (dl casa/fora → SplitBars)
  src/components/RaioXConfronto.tsx (dl → matchup-cols + verdict-badge)
  src/components/RaioXConfronto.test.tsx (+1 teste: tom do badge)
  src/components/SortableHeader.tsx (prop `as`: 'th' | 'div')
  src/theme.css                     (+~220 linhas: player-row, split-bars,
                                      matchup-cols, chance-badge, verdict-badge)
```

## Testes, cobertura, build e lint

Suíte completa (`npm test`):

```text
Test Files  23 passed (23)
     Tests  105 passed (105)
```

Cobertura (`npm run coverage`):

```text
All files       |  95.78 |    92.62 |   95.96 |   97.31
Jogadores.tsx   |  92.72 |    94.87 |    86.2  |   91.48
```

Build (`npm run build`): `✓ built in 372ms` — sem erro de tipo.

Lint (`npm run lint`): sem erro nos arquivos desta fase (os 2 warnings
existentes são de `AuthContext.tsx`, pré-existentes, fora de escopo).

## Passo a passo de validação humana

1. `docker compose up -d` no `backend/` e `npm run dev` no `web/`.
2. Abrir `/jogadores` — confirmar que a lista aparece como um card
   único com linhas em grid (não mais uma tabela HTML pura), média
   casa/fora coloridas, badge de chance de pontuar colorido.
3. Clicar em qualquer ponto de uma linha (não só no nome) — confirmar
   que navega pro detalhe do jogador.
4. Usar Tab pra navegar pelo teclado — confirmar que cada linha recebe
   foco visível (contorno verde) e Enter navega.
5. Abrir o detalhe de um jogador — confirmar duas barras horizontais
   (casa verde, fora ocre) em vez de texto puro pra média casa/fora, e
   os 3 blocos do raio-x de confronto com o badge de veredito colorido
   (verde/neutro/vermelho conforme o veredito).
