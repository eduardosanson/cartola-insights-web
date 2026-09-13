# Log de Decisões — Issue #4 — Ajuste de Tipografia, Escala de Fontes & Design Tokens

## DOR → SPEC — 2026-09-13

- Decisão: execução autônoma e não-supervisionada disparada pelo board; sem brainstorming interativo — usar o corpo da issue como insumo completo e registrar suposições aqui em vez de pausar.
- Decisão: tratar a issue como unidade independente de entrega na branch `feature/4`, escopo restrito ao frontend `cartola-insights-web`.
- Suposição: o mapeamento da stack visual mostrou que tokens de tipografia (`--font-heading`/`--font-body`/`--font-mono`), fontes Google (Barlow Condensed, Karla, JetBrains Mono) e `formatNumber()`/`formatCurrency()` já existem de fases anteriores (fase7-redesign-visual). O escopo real desta issue é: (1) completar a cobertura de formatos numéricos (porcentagem, inteiro, decimal de 1 casa) com tratamento de `null`/`undefined`; (2) adicionar uma escala tipográfica com tokens + classes utilitárias reutilizáveis (RF05), hoje inexistente (tamanhos de fonte são "magic numbers" espalhados no CSS); (3) corrigir 3 tokens de design referenciados no CSS mas nunca definidos (`--border-strong`, `--text-faint`, `--bg-sunken`) — bug real de tokens, dentro do escopo do card; (4) aplicar os novos formatadores/tokens em pontos representativos que hoje usam `toFixed()` (separador decimal `.` en-US, incorreto em pt-BR) ou concatenação manual de `%`.

## SPEC → PROMPT PLAN — 2026-09-13

- Decisão: manter `formatNumber()` com o comportamento atual (até 2 casas, sem padding) para não quebrar os ~20 pontos de uso já existentes; adicionar `formatPercent`, `formatInteger` e `formatDecimal` como funções novas no mesmo módulo, em vez de um único formatador com `options` — mantém a assinatura simples já usada em toda a base e segue o padrão que `formatCurrency` já estabeleceu.
- Decisão: tornar todos os formatadores tolerantes a `null`/`undefined` (retornam `—`) em vez de exigir ternários no call site — simplifica 2 pontos de uso existentes (`Jogadores.tsx`, `ModalCompararJogador.tsx`) sem alterar o texto renderizado (testes already esperam `—`).
- Decisão: escala tipográfica como tokens CSS (`--fs-*`, `--lh-*`, `--fw-*`) + 5 classes utilitárias (`.text-title`, `.text-subtitle`, `.text-label`, `.text-value`, `.text-aux`) cobrindo os papéis citados no RF05, aplicadas em poucos pontos representativos (RF07/CA04) — sem renomear ou remover nenhuma classe/seletor existente, para não ampliar o raio de impacto visual (RNF01).
- Risco aceito: a escala tipográfica nova coexiste com os tamanhos ad hoc já usados nos seletores específicos do `theme.css` (ex.: `.mb-value`, `.player-row .num`); não há refatoração desses seletores para os novos tokens nesta issue — fica para o próximo card de refinamento de tabelas/cards, citado como dependência na issue.

## PROMPT PLAN → TDD — 2026-09-13

- Decisão: cobrir os novos formatadores por TDD (red → green) no arquivo de teste já existente (`formatNumber.test.ts`), mantendo os testes atuais intactos.
- Decisão: os componentes que passam a usar `formatPercent`/`formatDecimal` já têm testes que verificam o texto renderizado (`SeloRisco.test.tsx`, `RaioXConfronto.test.tsx`) — reutilizados como rede de segurança, sem precisar duplicar asserts.
