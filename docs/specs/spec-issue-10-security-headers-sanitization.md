# Spec: Issue #10 — Security headers e sanitização defensiva

## Contexto de Negócio

A aplicação Web (`cartola-insights-web`, publicada na Vercel) hoje não define nenhum cabeçalho HTTP de segurança em `vercel.json` além de `rewrites`, e os campos de busca livre do frontend (autocomplete de atletas e filtro da lista de jogadores) não têm nenhuma camada defensiva própria contra injeção — dependem só do escape automático do React. Isso deixa a aplicação exposta a Clickjacking (embed em iframe malicioso), MIME sniffing, leak de referrer entre origens e, em qualquer ponto futuro onde um valor de busca passe a ser usado fora do JSX puro (ex.: log, `title`, atributo, nova feature), a XSS.

## Requisitos Funcionais

- RF01: `vercel.json` deve aplicar headers de segurança a todas as rotas (`source: "/(.*)"`), preservando o `rewrites` existente para o SPA.
- RF02: Incluir os headers exigidos pela issue: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- RF03: A CSP deve permitir apenas as origens externas realmente necessárias: Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), o backend de produção (`https://backend-production-9114.up.railway.app`) e o CDN de assets Cartola/Globo (`s.glbimg.com`, `s3.glbimg.com`) — nunca um wildcard (`*`) em `default-src`, `script-src` ou `connect-src`.
- RF04: Adicionar `Permissions-Policy` e `Strict-Transport-Security` como hardening complementar para viabilizar nota A/A+ (DoD desta issue).
- RF05: Sanitizar defensivamente o valor digitado nos dois campos de busca livre do frontend (`AtletaAutocomplete`, `Jogadores`) antes de ele alimentar qualquer estado/filtro — remover tags HTML e caracteres de controle, sem quebrar busca por nomes com acentos, apóstrofos ou hífen.

## Requisitos Não-Funcionais

- RNF01: A CSP não pode bloquear a aplicação React em produção (build real do Vite, sem `unsafe-eval`; `unsafe-inline` em `style-src` é aceito porque o app usa `style={{...}}` extensivamente e não usa `<style>` inline arbitrário vindo de dados externos).
- RNF02: A sanitização de busca não deve usar `dangerouslySetInnerHTML` nem escape manual de HTML — o React já escapa texto renderizado; a função de sanitização atua só sobre o valor armazenado em estado, como camada extra.
- RNF03: Os testes devem validar a configuração e o comportamento sem depender de deploy externo (sem chamada real a securityheaders.com nos testes automatizados).

## Critérios de Aceite

- CA01: `vercel.json` contém uma entrada `headers` com `source: "/(.*)"` e os 4 headers de RF02 com os valores exatos pedidos pela issue.
- CA02: A CSP declarada tem `default-src 'self'` e listas explícitas (sem `*`) para as origens de RF03.
- CA03: Digitar `<img src=x onerror=alert(1)>` (ou `<script>`) no campo de busca do `AtletaAutocomplete`/`Jogadores` nunca deixa uma tag HTML "crua" no DOM nem no estado — o valor sanitizado preserva apenas o texto, sem afetar a busca de nomes normais (com acento/apóstrofo).
- CA04: `npm run build` continua verde com os novos headers e a sanitização aplicada.

## Definition of Done (DOD)

- [ ] Código implementado e compilando
- [ ] Testes unitários/componentes escritos e passando
- [ ] Lint sem erros
- [ ] Pre-commit hook existente (`.githooks/pre-commit`) compatível
- [ ] Evidências capturadas em `docs/evidence/issue-10-security-headers-sanitization.md`
- [ ] Passo a passo de validação humana escrito, incluindo validação manual em securityheaders.com/curl pós-deploy
- [ ] PR aberta contra `main` referenciando `Closes #10`
- [ ] Item movido para "In review" no board

## Fora de Escopo

- Alterações no backend (`cartola-insights-backend`).
- Sanitização de campos de autenticação (login/registro) — não são "parâmetros de busca" e já passam por validação no backend.
- Nonce/hash dinâmico para CSP (exigiria middleware/Edge Function); fora do escopo de um `vercel.json` estático.
- Deploy real e leitura da nota A/A+ em securityheaders.com — depende de merge/deploy; fica como passo de validação humana pós-merge.
