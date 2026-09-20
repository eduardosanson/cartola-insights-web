# Evidências — Issue #30

- Teste de contrato: 11 testes vermelhos antes do workflow, 12/12 verdes depois (`src/pre-merge-manual-config.test.ts`).
- YAML validado com PyYAML (`yaml ok`); `ci.yml` inalterado.
- `npm run lint`: exit 0 (2 warnings preexistentes em `AuthContext.tsx`).
- `npm run build`: verde.
- `npm run coverage`: Statements 99.89%, Branches 97.41%, Functions 100%, Lines 100%.
- Validação prática do workflow (dispatch real) só é possível após o merge na `main`.
