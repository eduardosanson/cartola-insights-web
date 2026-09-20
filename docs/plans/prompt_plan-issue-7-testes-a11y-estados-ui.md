# Prompt Plan: issue #7

1. [ ] Instalar `vitest-axe`, registrar matcher em `setupTests.ts`
2. [ ] `src/tests/a11y.test.tsx` (RED onde houver violação) → corrigir markup
3. [ ] ARIA: `PentagonoQualidade.test`, `SplitBars.test` (RED) → implementar
4. [ ] `src/tests/teclado.test.tsx`
5. [ ] `src/tests/estados-ui.test.tsx` (loading/vazio/erro por página; RED → `role="status"` nos loadings)
6. [ ] `src/tests/contraste.test.ts` (tokens de `theme.css`, claro e escuro)
7. [ ] lint, tsc, test, build, evidências

## Riscos
- Contraste real pode falhar em tokens → corrigir tokens ou registrar débito.
