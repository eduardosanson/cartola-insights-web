# Log de Decisões — Issue #10 — Security headers e sanitização defensiva

## DOR → SPEC — 2026-09-12

- Decisão: tratar a issue GitHub #10 como unidade independente de entrega, executada de forma autônoma e não-supervisionada (disparo do board); aprovação humana ocorre na revisão do PR, não em checkpoint intermediário.
- Decisão: manter a branch de trabalho `eduardosanson/10-hardening-de-seguranca` já provisionada para este worktree em vez de criar `feature/10` — esse nome de branch já existe, sem push, em outro worktree local do mesmo repositório (`docs: plan issue 10 security headers`, 2026-08-29), abandonado antes de qualquer implementação; recriá-lo aqui exigiria tocar outro worktree, o que este fluxo não deve fazer sem necessidade. A branch atual já parte de `main` (mesmo commit de `origin/main`), preservando a intenção do guardrail G2.
- Decisão: escopo de "sanitização de parâmetros de busca" restrito aos dois campos de busca livre existentes (`AtletaAutocomplete`, `Jogadores`) — não inclui campos de autenticação (login/registro), que já são validados/tratados pelo backend e não são "busca".
- Risco aceito: o whitelist de domínios da CSP inclui `s.glbimg.com`/`s3.glbimg.com` (CDN de assets Cartola/Globo) mencionado no DoR como "já mapeado", mesmo sem uso atual no código — é uma concessão preventiva de baixo risco (`img-src` não executa script) para não bloquear uma futura integração de escudos/fotos sem exigir novo PR de CSP.

## SPEC → PROMPT PLAN — 2026-09-12

- Decisão: CSP usa `style-src 'self' 'unsafe-inline' ...` porque a maior parte dos componentes usa `style={{...}}` (atributo inline) extensivamente; sem essa concessão o app quebraria visualmente em produção. Trade-off documentado — inline `style` não é vetor de execução de script.
- Decisão: `connect-src` da CSP inclui apenas o domínio de produção do backend (`https://backend-production-9114.up.railway.app`, lido de `.env.production`), não `localhost` — os headers do `vercel.json` só se aplicam ao build servido pela Vercel, nunca ao `vite dev` local.
- Decisão: além dos 4 headers pedidos literalmente na issue (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy), adicionar `Permissions-Policy` e `Strict-Transport-Security` — necessários na prática para nota A/A+ no securityheaders.com, que é o próprio critério do DoD desta issue.
- Risco aceito: validação real em securityheaders.com/curl contra HTTPS de produção só é possível após deploy (merge); evidência local usa `curl -I` contra `vercel dev`/build servido localmente ou inspeção estática do `vercel.json`, com o passo remoto documentado como validação manual pós-merge.

## TDD → BUILD → EVIDÊNCIAS — 2026-09-12

- Decisão: sanitizar por remoção de código de caractere (`codePointAt <= 0x1f || === 0x7f`) em vez de regex com classe de caracteres de controle — no ambiente de escrita desta sessão, escapes `\u`/`\x` dentro de literais de regex foram gravados como bytes de controle crus no arquivo-fonte; a versão numérica evita esse risco de forma equivalente e mais legível.
- Decisão: CLI da Vercel não está disponível neste ambiente sandboxed; a validação de headers ficou limitada a testes que fazem parse estático do `vercel.json` (`src/security-headers.test.ts`) mais inspeção manual — `curl -I`/securityheaders.com contra produção fica registrado como passo de validação humana pós-merge em `docs/evidence/issue-10-security-headers-sanitization.md`.
- Risco aceito: 264 testes passando, 96.45% de cobertura de statements (piso do projeto é 90%); build de produção verde sem novos warnings de lint além dos 2 pré-existentes em `AuthContext.tsx`, não relacionados a esta issue.

## PR REVIEW (chatgpt-codex-connector, PR #22) — 2026-09-13

- Decisão: aplicar `sanitizeSearchInput` também em `ModalCompararJogador.tsx` — terceiro campo de busca livre com o mesmo padrão de `AtletaAutocomplete`/`Jogadores`, que ficou fora do escopo original por não ter sido mapeado como página distinta na spec.
- Decisão: trocar a checagem manual de código de caractere (`<= 0x1f || === 0x7f`) por `/\p{Cc}/u.test(caractere)` — cobre a categoria Unicode "Control" completa (C0+C1+DEL) num único critério semântico, corrigindo a lacuna do range C1 (0x80-0x9F) apontada pelo review.
- Risco aceito: nenhum — ambos os achados eram P2 procedentes com cenário de falha real e correção de baixo risco; 266 testes passando após as correções.
