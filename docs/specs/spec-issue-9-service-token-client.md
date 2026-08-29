# Spec: Issue #9 — Service Token no cliente HTTP

## Contexto de Negócio

O backend protegido exige `X-Service-Token`. O frontend deve injetar esse header automaticamente quando `VITE_SERVICE_TOKEN` estiver configurado, sem quebrar dev local sem token, e expor erros 401/403 de forma clara.

## Requisitos Funcionais
- RF01: Ler `import.meta.env.VITE_SERVICE_TOKEN` em `src/api/client.ts`.
- RF02: Injetar `X-Service-Token` em GET, POST e DELETE quando houver token.
- RF03: Preservar headers específicos do caller, incluindo `Content-Type`.
- RF04: Tratar 401/403 com mensagem amigável e status preservado em `ApiError`.
- RF05: Documentar `VITE_SERVICE_TOKEN=` em `.env.example`.

## Requisitos Não-Funcionais
- RNF01: Sem logar o valor do token.
- RNF02: Dev local sem token não deve crashar.
- RNF03: Testes devem isolar ambiente sem vazar variável entre casos.

## Critérios de Aceite
- CA01: GET/POST/DELETE enviam `X-Service-Token` quando a variável existe.
- CA02: Sem token, requisição funciona sem header e sem exceção.
- CA03: 401/403 geram `ApiError` com status correto e mensagem clara.
- CA04: `.env.example` contém `VITE_SERVICE_TOKEN=` sem segredo real.

## Definition of Done (DOD)
- [ ] Código implementado e compilando
- [ ] Testes unitários/componentes escritos e passando
- [ ] Testes de integração/fluxo aplicáveis passando
- [ ] Lint sem erros
- [ ] Pre-commit hook existente executável/compatível
- [ ] Evidências capturadas em `docs/evidence/issue-9.md`
- [ ] Passo a passo de validação humana escrito
- [ ] PR aberta contra `main` referenciando a issue GitHub
- [ ] GitHub Project atualizado para revisão quando disponível

## Fora de Escopo

- Alterações no backend.
- Reescrita de arquitetura visual fora dos arquivos impactados.
- Configurações externas permanentes fora do GitHub/Vercel quando não houver credencial/API disponível; nesses casos, registrar passo manual nas evidências.
