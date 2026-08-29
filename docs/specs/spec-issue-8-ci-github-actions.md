# Spec: Issue #8 — Pipeline CI GitHub Actions

## Contexto de Negócio

O repositório precisa bloquear regressões de tipo, lint e testes em pushes/PRs para `main`, garantindo build verde antes de merge.

## Requisitos Funcionais
- RF01: Criar workflow `.github/workflows/ci.yml`.
- RF02: Disparar em `push` na `main` e `pull_request` para `main`.
- RF03: Usar Node.js 20 LTS com cache npm.
- RF04: Executar `npm ci`, `npm run lint`, `npx tsc -b`, `npm test -- --run --coverage`.

## Requisitos Não-Funcionais
- RNF01: Workflow deve ser determinístico e usar lockfile.
- RNF02: Permissões mínimas (`contents: read`) quando aplicável.
- RNF03: Não publicar artifacts/secrets nesta tarefa.

## Critérios de Aceite
- CA01: Arquivo de workflow é YAML válido.
- CA02: Branch/PR com erro de teste ou TypeScript falha no CI.
- CA03: Branch/PR válido executa lint, typecheck e coverage com sucesso.

## Definition of Done (DOD)
- [ ] Código implementado e compilando
- [ ] Testes unitários/componentes escritos e passando
- [ ] Testes de integração/fluxo aplicáveis passando
- [ ] Lint sem erros
- [ ] Pre-commit hook existente executável/compatível
- [ ] Evidências capturadas em `docs/evidence/issue-8.md`
- [ ] Passo a passo de validação humana escrito
- [ ] PR aberta contra `main` referenciando a issue GitHub
- [ ] GitHub Project atualizado para revisão quando disponível

## Fora de Escopo

- Alterações no backend.
- Reescrita de arquitetura visual fora dos arquivos impactados.
- Configurações externas permanentes fora do GitHub/Vercel quando não houver credencial/API disponível; nesses casos, registrar passo manual nas evidências.
