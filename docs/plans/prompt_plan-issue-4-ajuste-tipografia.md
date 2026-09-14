# Prompt Plan: Ajuste de Tipografia, Escala de Fontes & Design Tokens (Issue #4)

## Ordem de Implementação

1. [ ] Escrever testes (red) em `src/utils/formatNumber.test.ts` para `formatPercent`, `formatInteger`, `formatDecimal` — cobrindo valor positivo/negativo, arredondamento, zero e `null`/`undefined` (`—`). Estender também os testes de `formatNumber`/`formatCurrency` para `null`/`undefined`.
2. [ ] Implementar (green) `formatPercent`, `formatInteger`, `formatDecimal` em `src/utils/formatNumber.ts`, e adicionar guarda de `null`/`undefined` em todos os formatadores existentes (`formatNumber`, `formatCurrency`).
3. [ ] Adicionar tokens de escala tipográfica (`--fs-2xs` .. `--fs-xl`, `--lh-tight/snug/normal`, `--fw-regular/medium/semibold/bold`) e os 3 tokens de cor faltantes (`--border-strong`, `--text-faint`, `--bg-sunken`, light + dark) em `src/theme.css`.
4. [ ] Adicionar classes utilitárias `.text-title`, `.text-subtitle`, `.text-label`, `.text-value`, `.text-aux` em `src/theme.css`, construídas sobre os tokens do passo 3.
5. [ ] Aplicar nos pontos representativos (RF07):
   - `SimuladorValorizacao.tsx`: `toFixed(1)` → `formatDecimal(pontos, 1)`; `.text-value` nos dois `<strong>`; `.text-aux` no `<small>`.
   - `SeloRisco.tsx`: `formatNumber(...) + '%'` → `formatPercent(...)`.
   - `RaioXConfronto.tsx`: idem para `participacao_pontuacao_time_media`.
   - `MatrizCapitao.tsx`: idem para `chance_pontuar_percentual`.
   - `Jogadores.tsx` e `ModalCompararJogador.tsx`: remover ternário `=== null ? '—' : formatNumber(...)` (agora redundante).
   - `DetalheJogador.tsx`: `.text-title` no `<h2>{atleta.nome}</h2>`.
6. [ ] Rodar suíte de testes existente inteira — confirmar que nenhum teste de componente quebrou (mudança de formatação é comportamentalmente idêntica nos call sites tocados).
7. [ ] Validar responsividade mínima: revisar visualmente (ou via teste de snapshot simples, se necessário) os componentes tocados em larguras mobile (≤640px) e desktop.
8. [ ] Rodar `cartola-insights-web-test` e `cartola-insights-web-build` (ou os comandos `npm run lint`/`npm run coverage`/`npm run build` equivalentes).
9. [ ] Registrar evidências em `docs/evidence/issue-4-ajuste-tipografia.md`.
10. [ ] Commit atômico por responsabilidade, push da branch, abertura do PR com `Closes #4`.

## Dependências

- Depende de: nenhuma issue bloqueante conhecida.
- Impacta: qualquer card futuro de refinamento de tabelas/cards (consome os tokens/formatadores aqui criados).

## Riscos Identificados

- Risco: trocar `toFixed()`/concatenação manual por formatadores pode alterar texto renderizado e quebrar teste existente → mitigação: cada call site tocado já tem teste cobrindo o texto exibido; validados antes de seguir.
- Risco: tokens de cor novos (`--border-strong`, `--text-faint`, `--bg-sunken`) podem mudar contraste visual de elementos que hoje "falham silenciosamente" (propriedade CSS inválida é ignorada pelo browser, mantendo o valor herdado/inicial) → mitigação: escolher valores próximos ao comportamento atual (derivados de `--border`/`--text-muted`/`--bg` via `color-mix`), não uma paleta nova.
