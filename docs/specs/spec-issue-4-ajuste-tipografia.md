# Spec: [Pilar 1] Ajuste de Tipografia, Escala de Fontes & Design Tokens (Issue #4)

## Contexto de Negócio

O frontend do Cartola Insights é uma interface analítica: o usuário compara atletas, métricas, rankings e valores financeiros rapidamente. A experiência visual precisa de uma base tipográfica e numérica consistente para melhorar leitura, escaneabilidade e confiabilidade antes dos refinamentos de tabelas e cards.

Mapeamento da stack visual (pré-requisito desta spec): o projeto não usa Tailwind; estilos vivem em CSS puro (`src/theme.css` + `src/index.css`). Já existem, de fases anteriores:
- Fontes Google carregadas em `index.html` (Barlow Condensed, Karla, JetBrains Mono) com `preconnect`.
- Tokens `--font-heading`/`--font-body`/`--font-mono` em `:root` (light/dark).
- `.numeric`/`.num`/`.mb-value` etc. usando `font-variant-numeric: tabular-nums`.
- `src/utils/formatNumber.ts` com `formatNumber()` (decimal, até 2 casas) e `formatCurrency()` (cartoletas, `C$ 0,00`), ambos pt-BR, com testes em `formatNumber.test.ts`.

Gaps identificados que esta issue resolve:
1. Não há formatador de porcentagem, inteiro ou decimal de 1 casa — vários componentes concatenam `%` manualmente após `formatNumber()`, e pelo menos dois componentes (`SimuladorValorizacao`, `PentagonoQualidade`/`PentagonoDual`) usam `.toFixed()` nativo, que usa `.` como separador decimal (incorreto em pt-BR).
2. Não há escala tipográfica (tamanhos, pesos, line-heights) como tokens reutilizáveis — os valores de `font-size` no CSS são todos "magic numbers" distintos (ex.: 0.68rem, 0.7rem, 0.72rem, 0.78rem...), sem papéis nomeados (título/rótulo/valor/subtítulo/auxiliar).
3. Três custom properties são referenciadas no CSS mas nunca declaradas em `:root`: `--border-strong`, `--text-faint`, `--bg-sunken` (usadas em `.pentagon-ring-mid`, `.pentagon-label.hi`, `.pentagono-tooltip`, `.curva-eixo`) — bug de tokens de design, dentro do título da issue.
4. Formatadores não toleram `null`/`undefined`; vários call sites fazem ternário manual (`valor === null ? '—' : formatNumber(valor)`).

## Requisitos Funcionais

- RF01: definir tokens globais de escala tipográfica (tamanho, peso, line-height, letter-spacing) em `src/theme.css`, complementando os tokens de fonte já existentes.
- RF02: manter a fonte neutra de leitura (Karla/`--font-body`) já configurada — sem troca de fonte (RNF05).
- RF03: manter a fonte condensada (Barlow Condensed/`--font-heading`) já usada em títulos/rótulos; reforçar seu uso via classes utilitárias de título/rótulo.
- RF04: manter a fonte monoespaçada (JetBrains Mono/`--font-mono`) para números, com `tabular-nums`, usada pelos novos formatadores aplicados em pontos representativos.
- RF05: criar classes utilitárias de hierarquia tipográfica — `.text-title`, `.text-subtitle`, `.text-label`, `.text-value`, `.text-aux` — usando os tokens do RF01, sem remover ou renomear seletores existentes.
- RF06: revisar `src/utils/formatNumber.ts` para cobrir: moeda em cartoletas (`formatCurrency`, já existe), porcentagem (`formatPercent`, novo), inteiro (`formatInteger`, novo) e decimal de 1 casa (`formatDecimal`, novo), todos locale pt-BR e tolerantes a `null`/`undefined` (retornam `—`).
- RF07: aplicar os novos formatadores/tokens em pontos representativos: `SimuladorValorizacao.tsx` (troca `toFixed(1)` por `formatDecimal`, aplica `.text-value`/`.text-aux`), `SeloRisco.tsx`/`RaioXConfronto.tsx`/`MatrizCapitao.tsx` (trocam concatenação manual de `%` por `formatPercent`), `Jogadores.tsx`/`ModalCompararJogador.tsx` (removem ternário de `null` redundante), `DetalheJogador.tsx` (aplica `.text-title` no nome do atleta).
- RF08: testes unitários para cada formatador novo e revisado, cobrindo moeda, porcentagem, inteiro, decimal, `null`/`undefined` e arredondamento.

## Requisitos Não-Funcionais

- RNF01: a mudança respeita o design atual; nenhum componente, página ou seletor CSS existente é redesenhado — apenas tokens novos, classes utilitárias novas e troca pontual de formatadores.
- RNF02: tipografia preserva legibilidade em mobile e desktop, sem overflow/corte em botões ou cards — validado nos breakpoints `max-width: 640px`/`820px` já existentes.
- RNF03: números comparáveis mantêm `tabular-nums` (já aplicado nos seletores existentes; `.text-value` também usa `tabular-nums`).
- RNF04: nenhuma fonte nova é adicionada — apenas as 3 já carregadas via Google Fonts com `preconnect`/`display:swap` (RNF04 já satisfeito pela infraestrutura existente).
- RNF05: nenhuma paleta/cor nova de tema — apenas os 3 tokens de cor faltantes (`--border-strong`, `--text-faint`, `--bg-sunken`) são *definidos* (não inventados: usam cores derivadas de `--border`/`--text-muted`/`--bg` já na paleta, via `color-mix`) para corrigir uma referência CSS já existente e não resolvida.

## Critérios de Aceite

- CA01: tokens de tipografia (`--fs-*`, `--lh-*`, `--fw-*`) estão definidos em `src/theme.css`, documentados com comentário inline.
- CA02: `formatNumber.ts` exporta `formatPercent`, `formatInteger` e `formatDecimal` além de `formatNumber`/`formatCurrency`, cobrindo moeda, porcentagem e decimais, com comportamento testado.
- CA03: dados numéricos dos pontos representativos (RF07) usam `tabular-nums` (via `.text-value`, `.num`, `.mb-value` ou `.numeric`, já existentes ou novos).
- CA04: ao menos um conjunto representativo de componentes (`SimuladorValorizacao`, `SeloRisco`, `RaioXConfronto`, `MatrizCapitao`, `DetalheJogador`, `Jogadores`, `ModalCompararJogador`) aplica os tokens/formatadores novos para validar o padrão.
- CA05: testes unitários do formatador passam e cobrem arredondamento e valores ausentes (`null`/`undefined`).
- CA06: a mudança não introduz regressões de layout — todos os testes de componente existentes continuam passando; build de produção sem erros.

## Definition of Done

- [x] Tokens de tipografia configurados em `src/theme.css`.
- [x] Classes utilitárias para hierarquia tipográfica criadas.
- [x] `formatNumber()`/módulo revisado com suporte a moeda, porcentagem, inteiro e decimal.
- [x] Testes unitários de formatação numérica implementados.
- [x] Pontos representativos da UI usando tokens e alinhamento tabular.
- [x] Testes, lint e build do frontend passando pelas skills do projeto.
- [x] Evidência registrada no PR (`docs/evidence/issue-4-ajuste-tipografia.md`), com nota sobre validação visual desktop/mobile.

## Fora de Escopo

- Redesenhar cards, tabelas, badges, split-bars ou páginas completas.
- Corrigir ordenação com nulos por último (card seguinte de refinamento de tabelas/cards).
- Regressão visual automatizada com Playwright (card de testes visuais).
- Trocar paleta, tema ou identidade visual além da correção pontual de tokens faltantes (`--border-strong`/`--text-faint`/`--bg-sunken`).
- Migrar os seletores CSS específicos existentes (`.mb-value`, `.player-row .num`, etc.) para os novos tokens de escala — fica para o card de refinamento de tabelas/cards.

## Dependências e Riscos

- Dependência: este card antecede o refinamento de tabelas e cards (evitar retrabalho visual).
- Risco aceito: a aplicação dos tokens começa por pontos representativos; a base fica pronta para expansão no card seguinte.
- Risco mitigado: fontes externas já estavam integradas antes desta issue (sem novo risco de performance/layout shift introduzido aqui).
