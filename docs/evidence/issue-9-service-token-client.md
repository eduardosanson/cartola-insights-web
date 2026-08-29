# Evidências de Validação — Issue #9 — Service Token no cliente HTTP

## Contexto e Objetivo
Configurar o cliente HTTP do frontend (`web/src/api/client.ts`) para injetar automaticamente o header `X-Service-Token` a partir de `import.meta.env.VITE_SERVICE_TOKEN`, tratar mensagens de autorização (401/403) e documentar a variável em `.env.example`.

## O que foi implementado
1. `web/src/api/client.ts`:
   - Injeção dinâmica do header `X-Service-Token` quando `VITE_SERVICE_TOKEN` estiver preenchido.
   - Preservação e merge de headers customizados passados pelo chamador (`Content-Type`, etc.).
   - Fallback de mensagens amigáveis em `extrairMensagemDeErro` para status 401 ("Acesso não autorizado") e 403 ("Acesso negado") quando o backend não retornar payload `detail`.
2. `web/.env.example`:
   - Documentada a variável `VITE_SERVICE_TOKEN=`.
3. `web/src/api/client.test.ts`:
   - 7 novos testes de contrato cobrindo injeção em GET, POST, DELETE, ausência de token e mapeamento de mensagens de erro 401/403.
4. `web/tsconfig.app.json` e `web/vite.config.ts`:
   - Configurações de tipos Node e `NODE_ENV: test` para execução contínua sem quebra de ambiente.

## Evidências Automatizadas

### Testes Unitários e Cobertura (Vitest)
```text
 Test Files  39 passed (39)
      Tests  235 passed (235)

Statements   : 96.41% ( 887/920 )
Branches     : 90.86% ( 607/668 )
Functions    : 96.1% ( 321/334 )
Lines        : 97.3% ( 793/815 )
```

### Linter (oxlint)
```text
0 erros reportados.
```

### Build & Typecheck (Vite + tsc)
```text
✓ built in 209ms
dist/index.html                   0.93 kB │ gzip:  0.51 kB
dist/assets/index-wPQRAs04.css   20.57 kB │ gzip:  4.52 kB
dist/assets/index-DhnrX-Xj.js   291.64 kB │ gzip: 89.06 kB
```

## Passo a Passo de Validação Humana
1. Configure `VITE_SERVICE_TOKEN=meu-token-teste` no arquivo `.env` do frontend.
2. Inicie a aplicação com `npm run dev`.
3. Abra o DevTools na aba **Network** e acesse a listagem de atletas (`/jogadores`).
4. Verifique no cabeçalho das requisições HTTP se `X-Service-Token: meu-token-teste` está presente.
5. Simule uma resposta 401 ou 403 do backend e confirme que o cliente emite `ApiError` estruturado sem travar a interface.

## Achado de Review (Codex, PR #13) — não corrigido nesta issue

O Codex Review apontou que `VITE_SERVICE_TOKEN` é embutido em texto plano no bundle JS de produção (comportamento padrão de variáveis `VITE_*` no Vite), ficando visível a qualquer visitante via DevTools/bundle — o que anula a barreira de acesso restrito.

- Confirmação local: `dist/assets/index-*.js` gerado por `npm run build` contém o valor de `VITE_SERVICE_TOKEN` definido em `.env` no momento do build.
- Decisão registrada em `docs/decisions/issue-9-service-token-client.md`: fix arquitetural (proxy server-side) fica fora do escopo desta issue e foi movido para a **issue #18**.
