# Prompt Plan: Proxy de API (#36)

1. [x] Testes de contrato e negativos (`api/_lib/proxy.test.ts`).
2. [x] `api/_lib/proxy.ts` (allowlist, headers, cookies, limites) + `api/proxy/[...path].ts`.
3. [x] Config: `.env.example`, typecheck de `api/`.
4. [x] Test + build + lint; PR.

Riscos: proxy público expõe rotas de leitura (aceito; fronteira documentada); Set-Cookie com `Domain` do backend precisa ser compatível com o domínio do web (validar em Preview).
