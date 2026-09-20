# Prompt Plan: Pipeline manual pré-merge (issue #30)

## Ordem de Implementação
1. [ ] Teste de contrato `src/pre-merge-manual-config.test.ts` (vermelho, workflow inexistente)
2. [ ] Implementar `.github/workflows/pre-merge-manual.yml` (verde)
3. [ ] Validar YAML com parser e confirmar `ci.yml` intacto
4. [ ] Documentar no README
5. [ ] Rodar lint, build, testes; capturar evidências
6. [ ] Push e PR com `Closes #30`

## Dependências
- Depende de: nada. Impacta: fluxo de merge (após a task [HUMANO] de proteção da `main`).

## Riscos Identificados
- Workflow só é disparável após existir na `main`: validação prática pós-merge.
- Injeção via input: `pr_number` validado como numérico e passado por `env`, nunca interpolado em `run`.
