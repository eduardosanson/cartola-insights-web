# Evidência — Issue #5 — Refinamento de Tabelas, Cards & Ordenação com Nulos por Último

## Funcionalidades implementadas

- **`useMultiSort` trata `null` corretamente nas duas direções**: accessors agora podem
  retornar `number | null`; o comparador trata `null` como sempre posterior a qualquer valor
  real, independente de `asc`/`desc` (antes, a inversão de sinal do `desc` fazia qualquer
  sentinela numérico funcionar só em uma direção). Dois valores `null` empatam e caem no
  próximo critério de ordenação, ou na ordem original (estável).
- **Chance de pontuar (`Jogadores.tsx`)**: accessor deixou de usar o sentinela `?? -1` e agora
  repassa o valor bruto (`number | null`) — corrige o bug em que atletas sem dado apareciam
  primeiro ao ordenar em ordem crescente.
- **Ajuste visual mínimo**: `.chance-badge` passa a usar os tokens de tipografia já existentes
  (`--fs-2xs`, `--fw-semibold`) no lugar de magic numbers (`0.72rem`, `600`) — zero mudança
  visual perceptível (diferença de 0,02rem).

## Arquivos criados/modificados

| Arquivo | Linhas | Descrição |
|---|---|---|
| `src/hooks/useMultiSort.ts` | +10/-2 | accessors `number \| null`; nulls last independente da direção |
| `src/hooks/useMultiSort.test.ts` | +64 | 3 novos testes: nulls last em desc, em asc, empate entre nulos com fallback de critério |
| `src/pages/Jogadores.tsx` | +3/-4 | remove sentinela `-1` do accessor de chance de pontuar |
| `src/pages/Jogadores.test.tsx` | +22/-1 | teste existente renomeado (desc) + novo teste cobrindo ordem ascendente |
| `src/theme.css` | +3/-2 | `.chance-badge` usa `--fs-2xs`/`--fw-semibold` |

## Comportamento do ponto de vista do usuário

- Na tela de Jogadores, ao clicar duas vezes no cabeçalho "Chance de pontuar" (ordem
  ascendente), atletas sem dado de chance de pontuar agora aparecem por último — antes
  apareciam primeiro.
- Ao clicar uma vez (ordem descendente), o comportamento já correto se mantém.
- Nenhuma mudança perceptível nas demais colunas ordenáveis (preço, médias, overall) nem no
  visual da badge de classificação de chance de pontuar.
- `overall_score` mantém o mesmo bug de nulls-first em ordem crescente — intencionalmente
  fora do escopo desta task (ver `docs/decisions/issue-5-refinamento-tabelas.md`).

## Resultado dos testes automatizados

```
$ npm run lint
oxlint — sem erros (2 warnings pré-existentes em AuthContext.tsx, não relacionados)

$ npm run coverage
Test Files  42 passed (42)
     Tests  304 passed (304)
Statements: 96.54% | Branches: 91.3% | Functions: 96.18% | Lines: 97.39%

$ npm run build
tsc -b && vite build
✓ built in <1s
```

## Passo a passo de validação manual

### Pré-requisitos
- [ ] Ambiente: dev (`npm run dev`) ou build de produção local.
- [ ] Dados: pelo menos um atleta com `chance_pontuar_percentual: null` na lista (ex.: técnicos,
  que normalmente não têm esse dado).

### Passo a passo
1. Acesse a tela de Jogadores.
2. Clique uma vez no cabeçalho "Chance de pontuar" (ordem decrescente) → atletas com maior
   percentual aparecem primeiro, atletas sem dado (—) ficam no final. ✅
3. Clique novamente no mesmo cabeçalho (ordem crescente) → atletas com menor percentual
   aparecem primeiro, atletas sem dado continuam no final (antes desta correção, apareciam
   primeiro). ✅
4. Clique nos demais cabeçalhos ordenáveis (Preço, Média geral, Média básica, Média casa,
   Média fora, Overall) e confirme que a ordenação continua funcionando como antes. ✅

### Casos de borda
- Dataset com múltiplos atletas sem dado de chance de pontuar → todos ficam agrupados no
  final, em qualquer direção, sem uma ordem específica entre eles (empate resolvido pela
  ordem original de chegada).
- Coluna "Overall" mantém o comportamento anterior (nulls first em ordem crescente) —
  não é regressão, é escopo intencionalmente não coberto por esta issue.
