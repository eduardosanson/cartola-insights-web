# Evidências — Issue #10 — Security headers e sanitização defensiva

## Funcionalidades implementadas

- `vercel.json` passa a declarar um bloco `headers` aplicado a todas as rotas (`source: "/(.*)"`), preservando o `rewrites` existente do SPA, com:
  - `Content-Security-Policy` restritiva (`default-src 'self'`, sem wildcard em nenhuma diretiva), liberando só Google Fonts, o backend de produção (`backend-production-9114.up.railway.app`) e o CDN Cartola/Globo (`s.glbimg.com`/`s3.glbimg.com`).
  - `X-Frame-Options: DENY` (+ `frame-ancestors 'none'` na CSP, defesa em profundidade contra Clickjacking).
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy` (câmera/microfone/geolocalização/pagamento/USB desabilitados) e `Strict-Transport-Security` (HSTS com `includeSubDomains; preload`) — hardening complementar para viabilizar nota A/A+.
- Nova função utilitária `sanitizeSearchInput` (`src/utils/sanitizeSearchInput.ts`): remove tags HTML e caracteres de controle de um texto livre, preservando acentos/apóstrofo/hífen e truncando em 100 caracteres.
- Aplicada no `onChange` dos dois campos de busca livre existentes no frontend: `AtletaAutocomplete` (autocomplete de atleta) e `Jogadores` (filtro por nome da listagem).

## Arquivos criados/modificados

- `vercel.json` (+31 linhas) — bloco `headers`.
- `src/utils/sanitizeSearchInput.ts` (novo, 22 linhas) — função de sanitização.
- `src/utils/sanitizeSearchInput.test.ts` (novo, 29 linhas) — 6 testes.
- `src/security-headers.test.ts` (novo, 96 linhas) — 14 testes validando `vercel.json`.
- `src/components/AtletaAutocomplete.tsx` (+2/-1) — aplica a sanitização no input.
- `src/components/AtletaAutocomplete.test.tsx` (+15) — teste de payload HTML no campo de busca.
- `src/pages/Jogadores.tsx` (+2/-1) — aplica a sanitização no input.
- `src/pages/Jogadores.test.tsx` (+10) — teste de payload HTML no campo de busca.

## Comportamento esperado do ponto de vista do usuário

- Nenhuma mudança visual ou de fluxo: os campos de busca continuam funcionando normalmente para nomes reais, incluindo acentos, apóstrofo e hífen (ex.: "José D'Ávila-Neto").
- Colar/digitar HTML (ex.: `<img src=x onerror=alert(1)>`) em qualquer um dos dois campos de busca nunca deixa a tag no input nem no estado usado para filtrar — só o texto sobrevive.
- Em produção (Vercel), o navegador aplica os headers acima a toda navegação da SPA.

## Resultado dos testes automatizados

```
$ npm run lint
> oxlint
src/contexts/AuthContext.tsx:51:17: warning react(only-export-components) [pré-existente, não relacionado a esta issue]
src/contexts/AuthContext.tsx:36:5: warning react(set-state-in-effect) [pré-existente, não relacionado a esta issue]
(exit code 0 — nenhum warning novo introduzido por esta issue)

$ npm run coverage
> vitest run --coverage

 Test Files  42 passed (42)
      Tests  264 passed (264)

All files          |   96.45 |     90.8 |   96.13 |   97.33 |
 src/utils/sanitizeSearchInput.ts | 100 | 83.33 | 100 | 100 | (linha 20: fallback defensivo `?? 0` de `codePointAt`, inalcançável em iteração for...of real)

$ npm run build
> tsc -b && vite build
✓ 69 modules transformed.
dist/index.html                   0.93 kB
dist/assets/index-wPQRAs04.css   20.57 kB
dist/assets/index--mWBazLP.js   291.82 kB
✓ built in 185ms
```

Baseline antes desta issue: 242 testes, 96.41% statements. Depois: 264 testes (+22), 96.45% statements — acima do piso de 90% exigido pelo projeto.

## Como Validar Esta Feature

### Pré-requisitos

- [ ] Ambiente: local (checkout desta branch) para os passos 1-3; produção/preview Vercel para o passo 4.
- [ ] Dados: nenhum dado externo necessário.

### Passo a Passo

1. `npm run build && npm run preview` (ou abrir a aplicação local) e acessar a página **Jogadores**.
2. No campo "Buscar por nome…", colar `<img src=x onerror=alert(1)>Gabigol` → o campo deve mostrar apenas `Gabigol`, sem alerta disparado e sem tag visível. ✅
3. Repetir o mesmo teste no autocomplete de atleta da página **Comparar**. ✅
4. **Pós-merge/deploy** (não executável neste ambiente sandboxed, sem CLI/credencial Vercel): após o deploy em `cartola-insights-web.vercel.app`, rodar `curl -sI https://cartola-insights-web.vercel.app | grep -iE "content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|strict-transport-security"` e confirmar os 6 headers presentes; opcionalmente conferir a nota em https://securityheaders.com/?q=cartola-insights-web.vercel.app. ✅ esperado: A/A+.

### Casos de Borda

- Buscar por nome com acento/apóstrofo/hífen (ex.: "José D'Ávila-Neto") → deve funcionar normalmente, sem nenhum caractere removido (`sanitizeSearchInput.test.ts`).
- Colar só uma tag sem texto (ex.: `<script>alert(1)</script>`) → sobra o texto interno da tag (`alert(1)`), nunca a tag em si — o React já trata esse texto como conteúdo puro ao renderizar, sem executar nada.
- Entrada maior que 100 caracteres → truncada, evitando abuso do filtro client-side.
