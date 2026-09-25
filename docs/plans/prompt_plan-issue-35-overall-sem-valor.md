# Prompt Plan: Overall sem valor (#35)

1. [x] Teste de componente: Overall crescente com null/0/80 (Red)
2. [x] Passar `overall_score` nullable ao `useMultiSort` (Green)
3. [x] Rodar lint, testes e build
4. [x] Evidências e PR

Risco: sentinela numérica oculta o caso especial; manter `null` para o hook tratar.
