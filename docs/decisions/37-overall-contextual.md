# Log de Decisões — Issue #37

## DOR → SPEC — 2026-09-27

- Decisão: estender tipo `Atleta` com `overall_contextual_score` e `rodada_alvo` como opcionais, preservando compatibilidade legada com `overall_score`
- Decisão: não implementar ordenação por score contextual nesta fase — foco em exibição e diferenciação visual
- Risco aceito: dados legados convivem com novos por período indefinido até migração completa no backend

## SPEC → PROMPT PLAN — 2026-09-27

- Decisão: usar acessor `atleta.overall_contextual_score ?? null` para garantir que o sort nunca receba `undefined`
- Decisão: adicionar coluna "Overall Contextual" após "Overall" (legado) mantendo ambas visíveis
- Risco aceito: tabela fica com uma coluna adicional — impacto visual mínimo em tela pequena, aceitável

## PROMPT PLAN → TDD → BUILD → EVIDÊNCIAS → PR — 2026-09-27

- Decisão: reuso de padrão existente de "—" para estado "não calculado" (compatível com overall_score legado)
- Decisão: renderizar seção "Overall Contextual" separada no detalhe, com legenda explicativa
- Decisão: corrigir testes legados que usavam `/overall/i` ambíguo — usar `getAllByRole(...)[0]` para "Overall" (primeira coluna)
- Resultado: 693 testes passando, 99.72% cobertura, PR #51 aberto
