# Issue #38 — Evidências de Migração para Proxy

## ✅ Verificações Completas

### Testes Unitários
```
Test Files: 54 passed (54)
Tests: 647 passed (647)
Coverage: 99.9%
- Statements: 99.9% (1012/1013)
- Branches: 97.26% (711/731)
- Functions: 100% (351/351)
- Lines: 100% (892/892)
```

### Build
```
✓ TypeScript build sem erros
✓ Vite build sucesso: 292.84 kB gzipped
✓ 69 módulos transformados
```

### Bundle Security Verification
```bash
$ strings dist/assets/index-C08AIz1B.js | grep -i vite_service
# Resultado: (vazio)

$ strings dist/assets/index-C08AIz1B.js | grep -i "x-service-token"
# Resultado: (vazio)

✓ Nenhum segredo, token ou referência a VITE_SERVICE_TOKEN detectado
```

### Lint
```
Lint: OK (apenas warnings pré-existentes em AuthContext.tsx)
```

## 📋 Mudanças Implementadas

### Client
- `src/api/client.ts`: apiGet/apiPost/apiDelete chamam `/api/proxy/*`
- Removido: leitura de `VITE_SERVICE_TOKEN`
- Removido: injeção de `X-Service-Token`
- Mantido: `credentials: 'include'` para sessão em mesmo domínio

### Testes
- `src/api/client.test.ts`: reescrito para novo contrato de proxy
- `src/api/*.test.ts` (7 arquivos): URLs atualizadas para `/api/proxy/*`
- Novo teste: verifica que X-Service-Token NÃO é injetado

### Configuração
- `.env.example`: removido `VITE_SERVICE_TOKEN`
- `vite.config.ts`: proxy para `/api/proxy` → `localhost:8000` (dev/preview)

### Suporte E2E
- `e2e/support/mockApi.ts`: interceptações para `/api/proxy/**`
- `e2e/support/env.ts`: E2E_API_BASE_URL = `http://localhost:5173`

## 🔄 Status E2E

✓ Testes e2e (Playwright) passam com 100% de sucesso (`npm run test:e2e`).
✓ Todas as rotas `/api/proxy/**` interceptadas com fixtures controlados no mock (`mockApi.ts`), com fallback 404 sem vazamento para backend real.

## 📝 Commits

1. `ea5d36e` — docs: #38 — spec, prompt plan e log de decisões iniciais
2. `1d7f883` — feat: #38 — migrar client.ts para chamar proxy server-side
3. `d478ca2` — test: #38 — atualizar testes de API para usar proxy
4. `062647c` — docs: #38 — atualizar log de decisões com fases finais
5. `b49e259` — fix: #38 — atualizar mock e2e para suportar proxy
6. `935d06f` — fix: #38 — migrar chamadas do client para caminho relativo do proxy no mesmo domínio
7. `85cf197` — fix: #38 — configurar proxy do Vite dev server com rewrite de /api/proxy e target BACKEND_ORIGIN
8. `6028daf` — fix: #38 — corrigir interceptação de rotas em mockApi.ts para testes e2e
9. `2f8b6a9` — fix: #38 — aguardar assincronismo da navegação após logout em Nav.test.tsx
10. `9e927e6` — docs: #38 — documentar fluxo do proxy em desenvolvimento local e atualizar .env.example
11. `38da9da` — docs: #38 — status final de migração para proxy
12. `2f60412` — chore: #38 — sincronizar branch com origin/main
13. `f8614c7` — fix: #38 — extrair campo code de erro retornado pelo proxy em ApiError

## 🔗 Referência

- PR #45: https://github.com/eduardosanson/cartola-insights-web/pull/45
- Issue #38: https://github.com/eduardosanson/cartola-insights-web/issues/38
- Issue #18 (proxy backend): https://github.com/eduardosanson/cartola-insights-web/issues/18
