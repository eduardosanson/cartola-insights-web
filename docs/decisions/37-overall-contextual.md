# Log de Decisões — Issue #37

## DOR → SPEC — 2026-09-27

- Decisão: estender tipo `Atleta` com `overall_contextual_score` e `rodada_alvo` como opcionais, preservando compatibilidade legada com `overall_score`
- Decisão: não implementar ordenação por score contextual nesta fase — foco em exibição e diferenciação visual
- Risco aceito: dados legados convivem com novos por período indefinido até migração completa no backend
