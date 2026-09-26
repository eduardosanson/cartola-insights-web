# Evidências — #35

- Red: teste "sorts by overall ascending..." falhou com `?? -1` (null primeiro).
- Green: `npx vitest run` → 53 arquivos, 589 testes passando.
- `npm run lint` sem erros (2 warnings pré-existentes em AuthContext); `npm run build` OK.
