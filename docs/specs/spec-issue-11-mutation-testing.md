# Spec: Issue #11 — Mutation Testing no Frontend com Stryker Mutator

## Contexto de Negócio

O frontend do Cartola Insights contém lógica que influencia diretamente a confiança do usuário: ordenação de atletas, formatação de números, cálculos visuais e componentes analíticos. Cobertura de linhas alta não garante que os testes detectem regressões reais. Mutation testing valida se os testes quebram quando a lógica é alterada indevidamente.

## Requisitos Funcionais

- RF01: Adicionar Stryker Mutator ao frontend com runner compatível com Vitest.
- RF02: Criar configuração do Stryker cobrindo o máximo possível do código-fonte do frontend.
- RF03: Configurar score mínimo de mutação em 90%, falhando quando a meta não for atingida.
- RF04: Criar script local padrão (`npm run test:mutation`) para rodar mutation testing e gerar relatório.
- RF05: Configurar execução no CI para bloquear PR quando o mutation score ficar abaixo da meta.
- RF06: Gerar relatório HTML de mutation testing para inspeção local e/ou como artefato do CI.
- RF07: Documentar qualquer exclusão de arquivos ou padrões na configuração e justificar no PR.

## Requisitos Não-Funcionais

- RNF01: A configuração deve priorizar simplicidade operacional nesta primeira entrega (sem estratégia incremental por diff, sem sharding).
- RNF02: A execução deve ser reproduzível localmente pelo agente ou por qualquer dev, sem passos manuais fora de `npm install` + `npm run test:mutation`.
- RNF03: A configuração não deve exigir serviços externos nem segredos.
- RNF04: Exclusões não podem virar atalho para manter score artificialmente alto — só justificadas por inviabilidade técnica.
- RNF05: Se a duração ficar alta, otimizações futuras podem virar follow-up, mas o gate inicial continua bloqueante.

## Critérios de Aceite

- CA01: `npm run test:mutation` executa localmente e produz relatório de mutation testing.
- CA02: O CI roda mutation testing no frontend e falha o PR abaixo de 90% de mutation score (`stryker.config.json` com `thresholds.break: 90`).
- CA03: O escopo inicial (`mutate`) cobre todo o código-fonte `src/**/*.{ts,tsx}` tecnicamente mutável, exceto entry points e arquivos de teste.
- CA04: Arquivos/padrões excluídos da mutação possuem justificativa explícita neste spec e no PR.
- CA05: Relatório HTML é gerado em `reports/mutation/html/index.html` e pode ser consultado após a execução.
- CA06: `npm run test`/`npm run coverage` continuam rodando normalmente e não dependem da execução de mutação.

## Exclusões previstas e justificativa (RF07 / CA04)

- `src/main.tsx` — bootstrap do React (`createRoot().render`), sem branch lógico testável; já excluído do coverage do Vitest pelo mesmo motivo.
- `src/vite-env.d.ts` — apenas declaração de tipos, sem código executável.
- `src/setupTests.ts` — configuração do ambiente de teste (polyfills/matchers), não é lógica de produto.
- `src/**/*.test.{ts,tsx}` — os próprios arquivos de teste nunca são alvo de mutação (Stryker muta apenas código sob teste).

Nenhuma outra pasta ou arquivo de `src/` é excluído: API clients, hooks, componentes, páginas e utilitários de formatação entram no escopo de mutação, conforme CA03.

## Definition of Done (DOD)

- [ ] Dependências do Stryker e runner do Vitest adicionadas ao frontend.
- [ ] Configuração do Stryker criada com score mínimo de 90%.
- [ ] Script local de mutation testing adicionado ao `package.json`.
- [ ] CI atualizado para executar mutation testing e bloquear PR abaixo da meta.
- [ ] Relatório HTML gerado localmente e/ou publicado como artefato do CI.
- [ ] Exclusões, se existirem, documentadas e justificadas.
- [ ] Testes, lint e build do frontend passando pelas skills do projeto.
- [ ] Evidência do mutation score e do relatório anexada ao PR.

## Fora de Escopo

- Criar estratégia incremental avançada por arquivos alterados no PR.
- Ajustar toda a suíte de testes para perseguir mutantes sobreviventes fora do necessário para atingir o gate inicial de 90%.
- Implementar regressão visual com Playwright.
- Cobrir backend ou outros repositórios.
