# Spec: [Pilar 1] Refinamento de Tabelas, Cards & Ordenação com Nulos por Último (Issue #5)

## Contexto de Negócio

Usuários do Cartola Insights comparam atletas por métricas, risco, chance de pontuar e dados visuais em tabelas e cards. A coluna "Chance de pontuar" em `Jogadores.tsx` usa `useMultiSort` para ordenar, com o accessor `atleta.chance_pontuar_percentual ?? -1`. Esse sentinela numérico só resolve Nulls Last na ordem decrescente: como `-1` é sempre o menor valor possível (percentuais reais vão de 0 a 100), ele fica por último quando a maior aparece primeiro (desc), mas fica por primeiro quando a menor aparece primeiro (asc) — invertendo exatamente o comportamento esperado. Pequenas inconsistências assim reduzem a confiança na análise.

`useMultiSort` hoje calcula a diferença numérica entre os dois valores do accessor e inverte o sinal para `desc`; nenhum sentinela numérico fixo é compatível com as duas direções ao mesmo tempo, então a correção precisa estar na lógica de comparação do hook, não apenas no accessor.

## Requisitos Funcionais

- RF01: corrigir a ordenação de Chance de Pontuar para que valores `null` fiquem sempre no final, tanto em ordem crescente quanto decrescente.
- RF02: adicionar testes unitários de `useMultiSort` cobrindo valores nulos em ascendente e descendente (genérico, no nível do hook).
- RF03: aplicar tokens/tipografia já existentes nos pontos diretamente tocados por esta alteração (`.chance-badge`, exclusivo da coluna Chance de Pontuar).
- RF04: preservar alinhamento numérico e badges já existentes — nenhuma reestruturação de layout, apenas troca de valores "magic number" por tokens equivalentes.
- RF05: preservar comportamento atual de ordenação dos demais campos, incluindo `overall_score` (mesmo bug, fora de escopo desta task).

## Requisitos Não-Funcionais

- RNF01: a mudança é pequena e de baixo risco — a correção fica isolada na função de comparação de `useMultiSort`; nenhuma reestruturação de componentes.
- RNF02: não altera contratos de API nem formato dos dados consumidos (`Atleta.chance_pontuar_percentual` continua `number | null`).
- RNF03: não introduz screenshot obrigatório, snapshot visual ou pipeline E2E.
- RNF04: não causa layout shift perceptível — a troca de tokens em `.chance-badge` usa valores equivalentes aos já em uso (0.72rem→0.7rem via `--fs-2xs`, diferença de 0.02rem; 600→600 via `--fw-semibold`, idêntico).
- RNF05: testes rápidos, rodando na suíte unitária (Vitest) atual do frontend.

## Critérios de Aceite

- CA01: Chance de Pontuar ordenada de forma crescente mantém atletas com valor `null` no final.
- CA02: Chance de Pontuar ordenada de forma decrescente mantém atletas com valor `null` no final.
- CA03: testes unitários cobrem a regra Nulls Last em `useMultiSort` (ascendente e descendente) e em `Jogadores.tsx` (ambas as direções para Chance de Pontuar).
- CA04: `.chance-badge` usa tokens de tipografia existentes (`--fs-2xs`, `--fw-semibold`) sem alterar visualmente o resultado renderizado.
- CA05: ordenações existentes de outros campos (`preco_atual`, `media_geral`, `media_basica`, `media_casa`, `media_fora`, `overall_score`) continuam passando nos testes já existentes, sem alteração de comportamento.
- CA06: não há exigência de screenshot ou regressão visual nesta task.

## Definition of Done

- [x] Ordenação Nulls Last aplicada para Chance de Pontuar, independente da direção.
- [x] Testes unitários de `useMultiSort` cobrindo ascendente e descendente com valores nulos.
- [x] Ajuste visual mínimo aplicado apenas em `.chance-badge`.
- [x] Nenhum redesign amplo de tela ou componente introduzido.
- [x] Testes, lint e build do frontend passando pelas skills do projeto.
- [x] Evidência no PR com resultado dos testes automatizados e passo a passo de validação manual.

## Fora de Escopo

- Redesenhar a experiência completa de tabelas e cards.
- Aplicar Nulls Last globalmente para todos os campos numéricos (inclui `overall_score`, que tem o mesmo bug — ver `docs/decisions/issue-5-refinamento-tabelas.md`).
- Criar screenshots, snapshots ou regressão visual automatizada.
- Configurar Playwright.
- Refatorar arquitetura de componentes ou hooks além do necessário para a correção.

## Dependências e Riscos

- Dependência: base de tipografia/design tokens da issue #4 (`--fs-*`, `--fw-*` em `src/theme.css`), já mergeada em `main`.
- Risco: alterar a ordenação genericamente poderia afetar outros campos; mitigado restringindo a mudança de accessor a `chance_pontuar_percentual` e cobrindo os demais campos com os testes existentes (CA05).
- Risco aceito: `overall_score` mantém o mesmo bug de Nulls Last em ordem crescente, intencionalmente fora de escopo.
- Risco aceito: validação visual desta task é manual e leve; cobertura visual automatizada fica para a task de Playwright/regressão visual.
