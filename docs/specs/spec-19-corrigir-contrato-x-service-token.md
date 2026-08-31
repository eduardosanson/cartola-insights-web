# Spec: Corrigir contrato X-Service-Token no frontend main (Issue #19)

## Contexto de Negócio

O frontend `main` foi validado contra o backend `feature/11` num ambiente E2E isolado (Docker + Playwright). A suíte falhou porque o backend exige o header `X-Service-Token` em toda chamada de API, e o cliente HTTP atual (`web/src/api/client.ts`) não o envia — apesar de já existir uma implementação equivalente (não mergeada) na PR #13, aberta desde a issue #9 e bloqueada por um achado de segurança (issue #18: o valor de uma env `VITE_*` fica embutido em texto plano no bundle público do Vite).

Sem esse header, nenhuma chamada real do frontend a um backend blindado por service token funciona — bloqueando a integração ponta-a-ponta descrita na issue.

## Requisitos Funcionais

- RF01: O cliente HTTP (`requisitar()` em `client.ts`) deve incluir o header `X-Service-Token` em toda requisição (GET/POST/DELETE) quando `import.meta.env.VITE_SERVICE_TOKEN` estiver definida e não-vazia.
- RF02: Quando `VITE_SERVICE_TOKEN` não estiver definida (ex.: dev local sem o env var), o cliente deve continuar funcionando exatamente como hoje — sem o header, sem crash, sem warning bloqueante.
- RF03: Headers explícitos passados pelo chamador (ex.: `Content-Type: application/json` em `apiPost`) devem ser preservados; `X-Service-Token` nunca deve sobrescrever ou ser sobrescrito por eles — ambos coexistem no mesmo request.

## Requisitos Não-Funcionais

- RNF01: Nenhum valor de segredo real deve ser hardcoded no código-fonte — o token só chega via variável de ambiente de build (`VITE_SERVICE_TOKEN`).
- RNF02: `.env.production` deste repositório não deve definir `VITE_SERVICE_TOKEN` — o bundle de produção atual não deve embutir nenhum token real por efeito colateral desta mudança (mitigação parcial do risco descrito na issue #18; a correção arquitetural completa — proxy server-side — permanece em #18).
- RNF03: Cobertura de testes ≥ 90% mantida no arquivo alterado.

## Critérios de Aceite

- CA01: Dado `VITE_SERVICE_TOKEN=abc123` configurado, quando `apiGet`/`apiPost`/`apiDelete` são chamados, então o `fetch` recebe `headers['X-Service-Token'] === 'abc123'`.
- CA02: Dado `VITE_SERVICE_TOKEN` não configurado (undefined/vazio), quando `apiGet` é chamado, então o `fetch` não recebe o header `X-Service-Token` (paridade com o comportamento atual).
- CA03: Dado `VITE_SERVICE_TOKEN` configurado e um `apiPost` com body, quando a requisição é montada, então tanto `Content-Type: application/json` quanto `X-Service-Token` estão presentes nos headers enviados.
- CA04: Testes unitários de `client.test.ts` cobrindo CA01–CA03 passam.
- CA05: `cartola-insights-web-test` (lint + testes + coverage) e `cartola-insights-web-build` (typecheck + build) passam sem erros.

## Definition of Done (DOD)

- [x] Código implementado e compilando
- [x] Testes unitários escritos e passando
- [ ] Testes de integração E2E (`auth-service-token.spec.ts` em `chromium`/`mobile-chrome`) — **fora do alcance desta sessão**: a stack Docker/Playwright do ambiente E2E isolado não existe neste repositório (vive na integração frontend+backend externa citada na evidência da issue). Não reexecutável a partir daqui; ver observação abaixo.
- [x] Lint sem erros
- [ ] Pre-commit hooks passando (repo usa `.githooks/`; validado via skills equivalentes `cartola-insights-web-test`/`build`)
- [x] Evidências capturadas
- [x] Passo a passo de validação humana escrito (inclui como reexecutar a suíte E2E isolada manualmente)
- [x] PR aberta com link no Linear/GitHub (`Closes #19`)
- [ ] Issue movida para In Review (via script do board, fase 7)

## Fora de Escopo

- Implementar o proxy server-side da issue #18 (nova serverless function, `vercel.json`, remoção de `VITE_SERVICE_TOKEN` do client-side). Rastreado separadamente em #18.
- Tratamento visual amigável de erros 401/403 em `ApiError` (escopo da issue #9, não pedido pelos critérios de aceite de #19).
- Subir/derrubar a stack Docker E2E isolada e reexecutar `auth-service-token.spec.ts` — infraestrutura não presente neste repositório/worktree.
