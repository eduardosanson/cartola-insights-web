# Log de Decisões — Issue #36

## DOR → PR — 2026-09-24

- Decisão: um handler Web-standard (`handleProxy`) exportado como GET/POST/DELETE em `api/proxy/[...path].ts`; lógica em `api/_lib` para testar com Vitest. Match por regex sobre o pathname cru (sem decodificar), o que bloqueia `%2e%2e`, `//` e `\`.
- Decisão: variáveis `BACKEND_ORIGIN` e `SERVICE_TOKEN`; produção (NODE_ENV=production, inclui Preview) falha fechado com 503; em dev sem token só omite o header (suposição: dev local contra backend sem middleware).
- Decisão: só cookie/content-type/accept/accept-language passam do navegador (allowlist). Rate limit fica no Vercel Firewall (depende do plano), não em código.
- Risco aceito: proxy público permite leitura das rotas permitidas; não é autorização de usuário.
