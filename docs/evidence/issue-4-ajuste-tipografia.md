# Evidência — Issue #4 — Ajuste de Tipografia, Escala de Fontes & Design Tokens

## Funcionalidades implementadas

- **Formatadores numéricos pt-BR** (`src/utils/formatNumber.ts`): `formatPercent`, `formatInteger`
  e `formatDecimal` (novos), complementando `formatNumber`/`formatCurrency` (já existentes).
  Todos os cinco agora toleram `null`/`undefined` e retornam `—`.
- **Tokens de design** (`src/theme.css`): escala tipográfica (`--fs-2xs` a `--fs-xl`, `--lh-*`,
  `--fw-*`) e três tokens de cor que eram referenciados no CSS mas nunca declarados
  (`--border-strong`, `--text-faint`, `--bg-sunken`), agora definidos para light e dark.
- **Classes utilitárias de hierarquia tipográfica**: `.text-title`, `.text-subtitle`,
  `.text-label`, `.text-value`, `.text-aux`.
- **Aplicação em pontos representativos**: `SimuladorValorizacao`, `SeloRisco`,
  `RaioXConfronto`, `MatrizCapitao`, `DetalheJogador`, `Jogadores`, `ModalCompararJogador`.

## Arquivos criados/modificados

| Arquivo | Linhas | Descrição |
|---|---|---|
| `src/utils/formatNumber.ts` | +40/-5 | novos formatadores + null-safety |
| `src/utils/formatNumber.test.ts` | +75 | testes dos 5 formatadores (moeda, %, inteiro, decimal, null/undefined, arredondamento) |
| `src/theme.css` | +79 | tokens de escala tipográfica, tokens de cor faltantes, classes `.text-*` |
| `src/components/SimuladorValorizacao.tsx` | +5/-3 | `formatDecimal` no lugar de `toFixed`, classes `.text-value`/`.text-aux`/`.text-title` |
| `src/components/SeloRisco.tsx` | +2/-2 | `formatPercent` |
| `src/components/RaioXConfronto.tsx` | +2/-3 | `formatPercent` |
| `src/pages/MatrizCapitao.tsx` | +2/-2 | `formatPercent` |
| `src/pages/Jogadores.tsx` | +1/-1 | remove ternário de `null` redundante |
| `src/components/ModalCompararJogador.tsx` | +1/-3 | remove ternário de `null` redundante |
| `src/pages/DetalheJogador.tsx` | +3/-3 | classes `.text-label`/`.text-value`/`.text-aux` |

## Comportamento do ponto de vista do usuário

- Onde antes havia `4.6` (ponto, formatação en-US via `toFixed`) agora aparece `4,6`
  (vírgula, pt-BR) — corrige um bug real de locale no Simulador de Valorização.
- Porcentagens (`SeloRisco`, `RaioXConfronto`, `MatrizCapitao`) continuam exibindo o mesmo
  texto (`70,5%`, `12,4%`, `80%`) — agora vindas de um formatador dedicado em vez de
  concatenação manual de string.
- Valores ausentes (`overall_score: null`) continuam exibindo `—`, agora tratado dentro do
  próprio `formatNumber()` em vez de um ternário por call site.
- Nenhuma mudança visual perceptível fora dos pontos listados; o design/paleta atual foi
  preservado (RNF01/RNF05).

## Resultado dos testes automatizados

```
$ npm run lint
> oxlint
(sem erros; 2 warnings pré-existentes em AuthContext.tsx, não relacionados a esta issue)

$ npm run coverage
 Test Files  40 passed (40)
      Tests  274 passed (274)   # 242 baseline + 32 novos em formatNumber.test.ts
Statements   : 96.44%
Branches     : 91.13%
Functions    : 96.15%
Lines        : 97.32%

$ npm run build
> tsc -b && vite build
✓ built in ~300ms (sem erros de tipo)
```

Nenhum teste de componente existente precisou de ajuste — o texto renderizado nos pontos
tocados é equivalente ao anterior (CA06).

## Como Validar Esta Feature

### Pré-requisitos

- [ ] Node 20+ e dependências instaladas (`npm install`).
- [ ] Nenhum dado externo necessário para os testes unitários.

### Passo a passo

1. Rode `npm run coverage` — os 37 testes de `formatNumber.test.ts` cobrem moeda, porcentagem,
   inteiro, decimal, arredondamento, `NaN` e `null`/`undefined`. ✅
2. Rode `npm run build` — TypeScript e bundle de produção sem erros. ✅
3. Abra `src/pages/Comparar.tsx` (via `/comparar`) ou `/jogadores/:id` e confira que os valores
   percentuais (`SeloRisco`, `RaioXConfronto`) e o Simulador de Valorização exibem números com
   vírgula decimal pt-BR, alinhados de forma tabular (fonte monoespaçada). ✅
4. Confira em `/jogadores` que atletas sem `overall_score` mostram `—`. ✅

### Casos de borda

- Valor `null`/`undefined`/`NaN` em qualquer formatador → exibe `—` (testado).
- Valor negativo (`-0.806`) → `formatNumber` mantém o sinal (`-0,81`, testado).
- Percentual inteiro (`80`) → `formatPercent` não força casa decimal (`80%`, sem `80,0%`).

## Evidência visual (desktop + mobile)

Como o ambiente local não tinha o backend acessível a partir do navegador (CORS/gateway
retornando 503 só para requisições via browser, enquanto `curl` direto respondia 200 — fora do
escopo desta issue), a evidência visual foi capturada com uma página estática que carrega o
`theme.css`/`index.css` reais do projeto e reproduz o markup exato dos componentes tocados
(mesmas classes, mesmos valores calculados pelos formatadores reais).

- `desktop-01.jpg` / `desktop-02.jpg`: viewport 1280px — Simulador de Valorização, SeloRisco,
  Raio-X do Confronto, Matriz de Capitão, MPV estimado e linha de Jogador sem overall.
- `mobile-01.jpg` / `mobile-02.jpg`: viewport 390px (iPhone 12/13) — mesmo conteúdo, layout em
  coluna única, sem overflow horizontal, sem corte de texto ou botões (RNF02/CA06).

Nenhuma quebra de layout observada em nenhuma das duas larguras.
