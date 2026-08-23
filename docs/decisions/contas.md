# Log de Decisões — Telas de Conta (web)

## DOR → SPEC → PROMPT PLAN — 2026-08-23

- Decisão: estado de sessão via `AuthContext` que consulta `GET /contas/me`
  ao montar o app, em vez de tentar ler o cookie de sessão no cliente — o
  cookie é `httpOnly` por design (proteção contra XSS), então perguntar ao
  backend é a única forma correta de saber se há sessão válida.
- Decisão: `RotaProtegida` só existe pra `/conta` — as telas públicas
  (Tabela/Jogadores/Detalhe) continuam sem gate, decisão de produto já
  fechada no backend (`spec-fase4a-auth-contas.md`).
- Risco aceito: `apiGet` passou a enviar `credentials: 'include'` em toda
  chamada, inclusive as de dado público — inofensivo (não há cookie de
  sessão value pra vazar em request sem sessão), mas é uma mudança de
  comportamento do cliente HTTP existente, não só uma adição.
