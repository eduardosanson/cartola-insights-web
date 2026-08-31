# Prompt Plan: Corrigir contrato X-Service-Token no frontend main (Issue #19)

## Ordem de Implementação

1. [ ] Escrever testes (red) em `client.test.ts` cobrindo CA01–CA03:
   - `apiGet` envia `X-Service-Token` quando `VITE_SERVICE_TOKEN` está configurada.
   - `apiGet` NÃO envia o header quando a env var está ausente (regressão do comportamento atual).
   - `apiPost` com body envia `Content-Type` E `X-Service-Token` juntos.
   - `apiDelete` também envia `X-Service-Token` quando configurado.
2. [ ] Implementar em `client.ts`: montar um `headersPadrao` a partir de `import.meta.env.VITE_SERVICE_TOKEN`, mesclado com `init?.headers` sem sobrescrever headers explícitos do chamador, e passá-lo a `requisitar()`. Rodar testes até green.
3. [ ] Refactor: extrair a montagem de headers para uma função pequena e testável se o corpo de `requisitar()` ficar verboso; manter estilo não-verboso do arquivo.
4. [ ] Atualizar `.env.example` documentando `VITE_SERVICE_TOKEN=` (comentário indicando que é opcional e usado só em ambientes que exigem o contrato, ex.: E2E/staging).
5. [ ] Rodar `cartola-insights-web-test` (lint + testes + coverage) e `cartola-insights-web-build` (typecheck + build de produção).
6. [ ] Capturar evidências (output dos comandos) em `docs/evidence/issue-19-service-token-client.md`.
7. [ ] Commit atômico (`fix: injeta X-Service-Token nas chamadas do client HTTP (#19)`), push da branch `feature/19`, abrir PR com `Closes #19`.

## Dependências

- Depende de: nada bloqueante neste repositório — a stack E2E isolada (Docker + backend `feature/11`) vive fora deste worktree e não é reexecutável aqui.
- Impacta: qualquer chamada de API do frontend (`apiGet`/`apiPost`/`apiDelete`), já que o header passa a ser injetado globalmente em `requisitar()`.

## Riscos Identificados

- Risco: reintroduzir o mesmo achado de segurança da issue #18 (segredo em texto plano no bundle) se `VITE_SERVICE_TOKEN` for setada em produção sem o proxy. Mitigação: não setar a env var em `.env.production`; comentário no código apontando a issue #18 como débito técnico rastreado.
- Risco: não é possível confirmar aqui que `auth-service-token.spec.ts` passa de fato em `chromium`/`mobile-chrome`, pois a suíte E2E não está neste repositório. Mitigação: documentar isso explicitamente no PR como validação pendente de reexecução manual no ambiente isolado, sem bloquear a entrega do fix do lado do frontend.
