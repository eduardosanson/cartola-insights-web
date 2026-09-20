# Spec: Testes Automatizados de Acessibilidade & Estados de UI (issue #7)

## Contexto de Negócio
App de decisão rápida de escalação, com SVGs (Pentágono, SplitBars) e tabelas filtráveis. Testes de a11y evitam regressões silenciosas em refactors visuais.

## Requisitos Funcionais
- RF01: `vitest-axe` como devDependency, matcher `toHaveNoViolations` no setup.
- RF02: `src/tests/a11y.test.tsx` roda axe em `Nav`, `PentagonoQualidade`, `SplitBars` e páginas principais (dados mockados) sem violações critical/serious.
- RF03: testes ARIA de `PentagonoQualidade` e `SplitBars`.
- RF04: navegação por teclado (Tab, Enter, Espaço) em botões, filtros e cabeçalhos ordenáveis.
- RF05: estados loading/vazio/erro por página que consome API.
- RF06: contraste WCAG ≥ 4.5:1 calculado entre pares de tokens de `theme.css`.

## Requisitos Não-Funcionais
- RNF01: suíte de a11y < 30 s. RNF02: determinístico, sem rede. RNF03: WCAG 2.1 AA.

## Critérios de Aceite
- CA01–CA05 conforme issue #7.

## Definition of Done
- [ ] Testes escritos antes do ajuste de código
- [ ] lint, `tsc -b`, `npm test`, `npm run build` verdes
- [ ] PR com `Closes #7` e passo a passo
- [ ] Decisões em `docs/decisions/7.md`

## Fora de Escopo
Violações não-critical/serious (viram débito no log); testes E2E/Playwright.
