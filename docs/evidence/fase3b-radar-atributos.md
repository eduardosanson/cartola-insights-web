# Evidências — Fase 3b (web): Radar de Atributos

Data: 2026-08-23

## Resumo da Feature

`DetalheJogador` passa a consumir `GET /atletas/{id}/percentis` (Fase 3b
backend) e desenha um radar SVG de 4 eixos com os valores retornados. Não é
mais o radar de 6 eixos da POC — os 4 indicadores (pontuação média + 2
específicos da posição + disciplina) foram redesenhados na Fase 3a com base em
dado real.

## Arquivos Criados e Modificados

### Novos (4)

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/api/percentis.ts` | Cliente do endpoint: tipos `PercentisPadrao`/`PercentisGol` (union `PercentisAtleta`), `buscarPercentisAtleta` e o type guard `ehPercentisGol` |
| `src/api/percentis.test.ts` | 2 testes: chamada GET e propagação do erro (incluindo 404) com a mensagem do backend |
| `src/components/RadarAtributos.tsx` | Radar SVG puro (sem lib de gráficos): 4 eixos, anel externo, polígono de dados e lista de rótulo+percentil |
| `src/components/RadarAtributos.test.tsx` | 3 testes: rótulos por grupo de posição e matemática de raio (CA04) |

### Modificados (2)

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DetalheJogador.tsx` | Novo `useEffect` para buscar percentis; radar e mensagem de erro renderizados sem bloquear o restante da página |
| `src/pages/DetalheJogador.test.tsx` | +2 testes: radar carregado com sucesso e mensagem de erro no lugar do radar quando o endpoint dá 404 |

## Rótulos resolvidos pelo shape da resposta (RF02)

O componente decide os rótulos pelo type guard `ehPercentisGol` (presença da
chave `defesas`), não por reconsultar a posição do atleta — a posição já foi
resolvida no backend (decisão registrada em `docs/decisions/fase3b-radar-atributos.md`).

- Jogador de linha: Pontuação média, Participação em gol, Desarme, Disciplina
- Goleiro: Pontuação média, Defesas, Solidez (SG), Disciplina

## Matemática do radar (4 eixos)

`angulo_i = -π/2 + i·(2π/4)`, vértice = `(cx + R·(v/100)·cos, cy + R·(v/100)·sin)`.
Com todos os percentis em 100, os 4 vértices caem exatamente sobre o anel de
raio `R` — verificado no teste `com todos os percentis em 100, o poligono
toca o raio maximo nos 4 eixos` (CA04).

## Testes, cobertura, lint e build

```text
Test Files   18 passed (18)
Tests        82 passed (82)

Coverage: statements 96,32% · branches 92,77% · functions 95,57% · lines 97,01%
  percentis.ts        100% / 100% / 100% / 100%
  RadarAtributos.tsx  100% / 100% / 100% / 100%
  DetalheJogador.tsx  92,3% / 90% / 100% / 100% (linhas 23,33-41 = ramos de erro/carregamento pré-existentes)

lint (oxlint): 0 erros (2 warnings pré-existentes em AuthContext.tsx, fora desta fase)
build (tsc -b && vite build): sucesso, 45 módulos transformados
```

> Os testes/build/lint foram executados com `NODE_ENV=test` porque o ambiente
> do agente exporta `NODE_ENV=production` por padrão, o que quebra o
> `React.act` do React 19 no Vitest (ver nota em memória do agente).

## Passo a passo de validação humana

1. Subir o backend (`docker compose up -d --build` em `../../backend`) e o dev
   server (`npm run dev` no `web/`).
2. Abrir `http://localhost:5173/jogadores`, clicar num atacante com bastante
   participação em gol na temporada.
   - Confirmar que o radar mostra "Pontuação média", "Participação em gol",
     "Desarme" e "Disciplina", com "Participação em gol" alto.
3. Abrir um goleiro.
   - Confirmar "Defesas"/"Solidez (SG)" em vez de "Participação em gol"/
     "Desarme".
4. Abrir um atleta com poucos jogos (ou um técnico, se a listagem mostrar).
   - Confirmar a mensagem do `detail` no lugar do radar, sem quebrar a página
     (o histórico segue aparecendo normalmente).

## Decisões Registradas

Ver `docs/decisions/fase3b-radar-atributos.md` (rótulo por chave da resposta,
não por posição; erro de percentis informativo sem `role="alert"`).