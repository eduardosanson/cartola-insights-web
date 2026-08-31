# Evidências — Issue #19: Corrigir contrato X-Service-Token no frontend main

## O que foi implementado

- `src/api/client.ts`: `requisitar()` passa a mesclar um header `X-Service-Token` (lido de `import.meta.env.VITE_SERVICE_TOKEN`) com os headers explícitos do chamador, em toda chamada `apiGet`/`apiPost`/`apiDelete`. Sem a env var configurada, o comportamento é idêntico ao anterior (nenhum header extra).
- `src/vite-env.d.ts`: tipagem de `VITE_SERVICE_TOKEN` como opcional.
- `.env.example`: documenta a nova var como opcional, com aviso para não configurá-la em produção.
- `src/api/client.test.ts`: 4 testes novos cobrindo CA01–CA03 (envio do header em GET/POST/DELETE quando configurado, e preservação de `Content-Type` junto de `X-Service-Token` em POST).

## Testes unitários

```
$ npx vitest run src/api/client.test.ts
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

## Suíte completa

```
$ npx vitest run
 Test Files  40 passed (40)
      Tests  238 passed (238)
```

## Cobertura

```
$ npm run coverage
 Test Files  40 passed (40)
      Tests  238 passed (238)

 % Coverage report from v8
 All files          |   96.4  |   90.84  |  96.13  |  97.29
 src/api            |  98.83  |   97.95  |    100  |    100

Statements   : 96.4% ( 884/917 )
Branches     : 90.84% ( 605/666 )
Functions    : 96.13% ( 323/336 )
Lines        : 97.29% ( 791/813 )
```
Threshold global de 90% atendido em todas as dimensões (`EXIT_CODE=0`).

## Build de produção / typecheck

```
$ npm run build
> tsc -b && vite build
✓ 68 modules transformed.
dist/index.html                  0.93 kB │ gzip:  0.51 kB
dist/assets/index-*.css        20.57 kB │ gzip:  4.52 kB
dist/assets/index-*.js        291.55 kB │ gzip: 89.03 kB
✓ built in 270ms
```

## Lint

```
$ npm run lint
> oxlint
(2 warnings pré-existentes em AuthContext.tsx, não relacionados a esta mudança; 0 erros)
```

## Verificação de segurança (issue #18)

Sem `VITE_SERVICE_TOKEN` definida em `.env.production`, o Vite substitui `import.meta.env.VITE_SERVICE_TOKEN` por `undefined` em tempo de build e o *dead-code elimination* do bundler remove inteiramente o branch condicional — inclusive a string literal `'X-Service-Token'`. Confirmado via `grep` no bundle gerado:

```
$ grep -io "service-token" dist/assets/*.js
(sem ocorrências — exit code 1)
```

Ou seja: o bundle de produção atual não carrega nenhum vestígio do header/token, mesmo com o novo código presente em `client.ts`. Isso mitiga o achado da issue #18 para o build atual; a correção arquitetural definitiva (proxy server-side) permanece rastreada separadamente em #18.

## Limitação conhecida

A suíte E2E isolada (`ENV=isolated npx playwright test`, stack Docker com backend `feature/11`) e o spec `auth-service-token.spec.ts` citados na issue não existem neste repositório — vivem no ambiente de integração externo descrito na evidência da issue. Não foi possível reexecutá-los a partir desta sessão. A seção "Como Validar" abaixo descreve o passo a passo para reexecução manual nesse ambiente.

## Como Validar Esta Feature

### Pré-requisitos
- [ ] Ambiente: local (dev) para validação unitária; ambiente E2E isolado (Docker) para o critério de aceite E2E.
- [ ] Node 20+, dependências instaladas (`npm ci`).

### Passo a Passo (validação local/frontend)
1. Rode `npm run coverage` — 238 testes devem passar, cobertura ≥ 90% em todas as dimensões. ✅
2. Rode `npm run build` — deve concluir sem erros de tsc/vite. ✅
3. Defina `VITE_SERVICE_TOKEN=abc123` num `.env.local` e rode a app (`npm run dev`); inspecione a aba Network do DevTools em qualquer chamada à API — o header `X-Service-Token: abc123` deve estar presente. ✅
4. Remova a env var — o header não deve mais aparecer, sem quebrar nenhuma chamada. ✅

### Passo a Passo (validação E2E isolada — ambiente externo)
1. No ambiente que já hospeda a stack Docker (frontend `main` desta branch + backend `feature/11`), configurar `VITE_SERVICE_TOKEN` com o valor esperado pelo backend.
2. Subir a stack e rodar `ENV=isolated npx playwright test`.
3. Verificar que `auth-service-token.spec.ts:8` passa em `chromium` e `mobile-chrome`.
4. Derrubar a stack com `docker compose down -v`.

### Casos de Borda
- Sem `VITE_SERVICE_TOKEN` configurada → nenhum header extra é enviado, comportamento idêntico ao anterior à #19.
- `apiPost` com body → `Content-Type: application/json` e `X-Service-Token` coexistem no mesmo request.
- Build de produção sem a env var → nenhum vestígio do header/token no bundle (`grep` confirma).
