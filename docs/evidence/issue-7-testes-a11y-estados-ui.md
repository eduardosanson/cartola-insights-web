# Evidências — issue #7

- `npm test`: 52 arquivos, 576 testes passando (suíte `src/tests` ≈ 2 s, RNF01).
- `npm run lint`: 0 erros (2 warnings pré-existentes em `AuthContext.tsx`).
- `npx tsc -b` / `npm run build`: verdes.
- `npm run coverage`: thresholds ≥ 90% atendidos (statements 99,89%, branches 97,41%).
- RED observado antes dos ajustes: axe (`aria-prohibited-attr`), ARIA de SplitBars/Pentagon, `role="status"` nos loadings, estado vazio da Tabela, contraste `--accent-away` (3,51:1), foco visível.
