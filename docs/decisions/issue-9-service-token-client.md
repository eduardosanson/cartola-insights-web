# Log de Decisões — Issue #9 — Service Token no cliente HTTP

## DOR → SPEC — 2026-08-29

- Decisão: tratar a issue GitHub #9 como unidade independente de entrega em branch `feature/9` porque os arquivos impactados são isoláveis dos demais itens Ready.
- Decisão: manter o escopo restrito ao frontend `cartola-insights-web`; alterações externas ficam como validação/evidência, não como pré-requisito bloqueante local.
- Risco aceito: tarefas paralelas podem tocar arquivos comuns (`package.json`, configs); mitigação é worktree separado por issue e PRs pequenos contra `main`.

## SPEC → PROMPT PLAN — 2026-08-29

- Decisão: decompor a execução em TDD por critério de aceite, depois implementação mínima e evidências, para preservar Red → Green → Refactor.
- Decisão: usar os comandos reais do `package.json` nesta sessão porque `.claude/skills/` ainda não está carregado como skill local pelo runtime atual.
- Risco aceito: validações externas como GitHub Actions/Vercel podem exigir evidência posterior ao push/PR.

## PROMPT PLAN → TDD — 2026-08-29

- Decisão: ler `import.meta.env.VITE_SERVICE_TOKEN` dentro da função `requisitar` a cada chamada para suportar dinamismo e stubs de teste isolados.
- Decisão: mesclar headers padrão antes de `init.headers` para garantir que chamadores específicos preservem `Content-Type` e headers customizados.
- Risco aceito: requisições sem token funcionam normalmente sem header, permitindo execução em desenvolvimento local sem autenticação.

## TDD → BUILD & EVIDÊNCIAS — 2026-08-29

- Decisão: incluir fallbacks amigáveis em `extrairMensagemDeErro` para códigos 401 ("Acesso não autorizado") e 403 ("Acesso negado") quando não houver `detail` JSON retornado pelo backend.
- Decisão: documentar `VITE_SERVICE_TOKEN=` em `.env.example` sem valores sensíveis de produção.
- Risco aceito: verificação em ambiente preview da Vercel depende de deploy e injeção de env na plataforma.


## PROMPT PLAN → TDD — 2026-08-29

- Decisão: criar testes unitários cobrindo injeção de `X-Service-Token` em GET, POST e DELETE, ausência de token sem crash, e mensagens padronizadas de 401/403.
- Decisão: ler `VITE_SERVICE_TOKEN` dentro de `requisitar()` para permitir stub dinâmico nos testes sem reload de módulo.
- Risco aceito: requisições locais sem backend ativo continuam lançando erro de rede transparente.

## TDD → BUILD — 2026-08-29

- Decisão: incluir `"node"` nos tipos de `tsconfig.app.json` e `NODE_ENV: 'test'` em `vite.config.ts` para paridade de ambiente Vitest.
- Decisão: adicionar `VITE_SERVICE_TOKEN=` em `.env.example` sem valores sensíveis.
- Risco aceito: warnings preexistentes do oxlint em `AuthContext.tsx` mantidos como evidência não-bloqueante (exit code 0).

## BUILD → EVIDÊNCIAS — 2026-08-29

- Decisão: registrar 235 testes passando com 96.41% de cobertura global em `docs/evidence/issue-9-service-token-client.md`.
- Decisão: documentar passo a passo de validação humana e configuração de variáveis de ambiente para deploy Vercel.

