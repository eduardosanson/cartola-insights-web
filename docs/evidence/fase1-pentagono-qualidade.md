# Evidências — Fase 1 (Novo Ciclo, web): Pentágono de Qualidade + Filtro de Mando

Data: 2026-08-24

## Resumo da Feature

- **Filtro de Mando**: Remoção do botão redundante "Todos" em `Jogadores.tsx`; botões "Casa" e "Fora" tornados *toggle* desselecionáveis (ao clicar no filtro ativo, ele desmarca e lista todos automaticamente).
- **Pentágono de Qualidade**: Novo componente `PentagonoQualidade.tsx` substitui o antigo `RadarAtributos.tsx` de 4 eixos em `DetalheJogador.tsx`. Traz o visual 100% alinhado ao `roadmap-v2.html`: 5 eixos temáticos (*Poder de fogo, Criação, Combate, Piso básico, Disciplina* para linha e *Pontuação média, Defesas, Solidez (SG), Piso básico, Disciplina* para goleiros), 4 anéis concêntricos regulares (25, 50, 75, 100%), polígono tracejado da mediana da posição (50%), polígono do jogador preenchido, rótulos SVG ao redor do gráfico com percentis destacados (`.pentagon-label.hi`), badge com Overall Score central e tooltip acessível por vértice com valor bruto real.

## Arquivos Criados, Modificados e Removidos

### Novos (2)

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/components/PentagonoQualidade.tsx` | Componente SVG do pentágono de 5 eixos, 4 anéis concêntricos, mediana tracejada, polígono do atleta, Overall Score e tooltips |
| `src/components/PentagonoQualidade.test.tsx` | 9 testes unitários cobrindo renderização, 5 eixos para linha e goleiro, anéis, mediana, overall score e tooltips |

### Modificados (5)

| Arquivo | Mudança |
|---------|---------|
| `src/api/percentis.ts` | Adicionado 5º eixo `media_basica`, tipos para `brutos`, `mediana_posicao` e `overall_score` em `PercentisPadrao` e `PercentisGol` |
| `src/api/percentis.test.ts` | Atualizado mock e asserção do endpoint com o novo payload da Fase 1 |
| `src/pages/Jogadores.tsx` | Removido botão "Todos"; "Casa" e "Fora" viraram toggle |
| `src/pages/Jogadores.test.tsx` | Testes para ausência do botão "Todos", toggle de mando e ordenação de médias casa/fora |
| `src/pages/DetalheJogador.tsx` | Substituído `RadarAtributos` por `PentagonoQualidade` |
| `src/pages/DetalheJogador.test.tsx` | Atualizado teste de percentis para validar `PentagonoQualidade` com 5 eixos e overall score |
| `src/theme.css` | Adicionados estilos para `.pentagono-wrap`, `.overall-badge`, `.pentagono-svg`, `.pentagono-tooltip` e `.pentagono-legend` |

### Removidos (2)

| Arquivo | Motivo |
|---------|--------|
| `src/components/RadarAtributos.tsx` | Substituído integralmente pelo `PentagonoQualidade.tsx` de 5 eixos |
| `src/components/RadarAtributos.test.tsx` | Testes do componente descontinuado |

## Resultados de Testes, Cobertura, Lint e Build

```text
Test Files  23 passed (23)
Tests       118 passed (118)

Coverage:
  Statements: 97.21% (piso: 90%)
  Branches:   93.44% (piso: 90%)
  Functions:  99.29% (piso: 90%)
  Lines:      98.75% (piso: 90%)

  PentagonoQualidade.tsx: 100% / 100% / 100% / 100%
  Jogadores.tsx:          100% / 94.87% / 100% / 100%
  DetalheJogador.tsx:     90% / 88.09% / 100% / 100%

Lint (oxlint): 0 erros (2 warnings conhecidos em AuthContext)
Build (tsc -b && vite build): 50 módulos transformados, 0 erros TypeScript
```

## Passo a Passo de Validação Humana

1. Executar `npm run dev` e acessar `http://localhost:5173/jogadores`.
2. No filtro de mando:
   - Clicar em "Casa": a listagem filtra apenas mandantes.
   - Clicar em "Casa" novamente: o botão desativa e a listagem volta a exibir todos os atletas.
   - Confirmar que não existe botão "Todos".
3. Clicar em um jogador de linha (ex.: atacante ou meia):
   - Confirmar a renderização do Pentágono com os 5 eixos: *Pontuação média, Participação em gol, Desarme, Piso básico, Disciplina*.
   - Confirmar a exibição dos 4 anéis concêntricos e a linha tracejada da mediana (50%).
   - Confirmar o badge do Overall Score com o valor da média dos percentis.
   - Passar o mouse / focar nos vértices para verificar o tooltip com rótulo, percentil e valor bruto real.
4. Clicar em um goleiro:
   - Confirmar os 5 eixos específicos de goleiro: *Pontuação média, Defesas, Solidez (SG), Piso básico, Disciplina*.

## Correção — Overall Score fora do centro (2026-08-24)

A implementação inicial (Antigravity) renderizava o Overall Score como
`<div>` HTML com `position: absolute; top: 1rem; right: 1rem` — um badge
no canto superior direito do card, divergindo de RF05/CA03 do spec
(`número central` / `aparece no centro do pentágono`). O teste original
só validava o texto exibido, não a posição, e por isso não pegou o
desvio.

Correção: o Overall Score agora é um `<text>` dentro do próprio `<svg>`,
centralizado em `(centroX, centroY)`. Novo teste
(`renderiza o Overall Score centralizado dentro do SVG do pentágono
(CA03)...`) verifica que o elemento `overall-score` está contido no
`<svg>` — não mais como irmão posicionado absoluto.

```text
Test Files  23 passed (23)
Tests       120 passed (120)

Coverage:
  Statements: 97.19% (piso: 90%)
  Branches:   90.27% (piso: 90%)
  Functions:  99.27% (piso: 90%)
  Lines:      98.75% (piso: 90%)

Lint (oxlint): 0 erros (2 warnings conhecidos em AuthContext)
Build (tsc -b && vite build): 50 módulos transformados, 0 erros TypeScript
```
