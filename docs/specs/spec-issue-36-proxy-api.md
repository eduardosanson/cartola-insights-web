# Spec: Proxy de API server-side (#36, parte da #18)

## Contexto de Negócio
`VITE_SERVICE_TOKEN` fica visível no bundle. O proxy (`/api/proxy/*`, função Vercel) injeta `X-Service-Token` no servidor. **Não é controle de autorização de usuário**: rotas públicas continuam acessíveis a qualquer visitante via proxy; o ganho é ocultar a credencial e restringir a superfície a uma lista fechada de rotas.

## Requisitos Funcionais
- RF01: só GET/POST/DELETE nas rotas da matriz da issue; `{id}` = dígitos; query repassada só para rota permitida.
- RF02: rejeitar `/admin`, `/metrics`, `/contas/login-token`, URL absoluta, traversal, rotas novas e métodos não usados.
- RF03: descartar `X-Service-Token` do navegador; injetar `SERVICE_TOKEN`.
- RF04: repassar `Cookie` e `Set-Cookie` (sessão e visitante); preservar status, corpo, `Retry-After` e o código `optimization_quota_exceeded` (429).
- RF05: falhar fechado (503) se `BACKEND_ORIGIN`/`SERVICE_TOKEN` faltarem em produção.

## Requisitos Não-Funcionais
- RNF01: corpo ≤ 1 MiB; timeout de 15 s; sem seguir redirects; sem headers hop-by-hop.
- RNF02: nada é logado (token, cookie, corpo).

## Critérios de Aceite
- CA01: token chega ao backend e não aparece na resposta.
- CA02: rotas fora da lista → 404/405 sem chamar o backend.
- CA03: 401/403/429 do backend preservados; cookies trafegam nos dois sentidos.
- CA04: sem segredo em produção → 503 sem chamada ao backend.

## Fora de Escopo
Migrar o cliente Vite para `/api/proxy` (fatia seguinte), autenticação de usuário, alterar backend. Rate limit: configurar via Vercel Firewall conforme plano do ambiente (não em código).
