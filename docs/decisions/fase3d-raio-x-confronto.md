# Log de Decisões — Fase 3d (Raio-X de Confronto, web)

## DOR → SPEC → PROMPT PLAN — 2026-08-23

- Decisão: `mando` e o rótulo do primeiro bloco ("Média em casa"/"Média
  fora") vêm do campo `mando` já resolvido pelo backend
  (`spec-fase3d-raio-x-confronto.md`) — o cliente só espelha, não
  reconsulta nem recalcula o mando do próximo confronto. Mesmo princípio
  já usado pro rótulo de eixo do radar na Fase 3b: uma decisão, uma fonte
  de verdade.
- Decisão: `pontos_cedidos_adversario`, `participacao_pontuacao_time_media`
  e `veredito` são tratados como **independentes** na renderização — cada
  um pode ser `null` sem esconder os outros dois blocos nem o restante da
  seção (RF03/CA03 do spec). Reflete a mesma independência que o backend
  já modelou na resposta (nenhum dos três é obrigatório junto).
- Decisão: reusar o tipo `Mando` já exportado por `api/atletas.ts`
  (`'casa' | 'fora'`) em `api/raioX.ts`, em vez de declarar um tipo
  idêntico com outro nome — evita duas definições do mesmo conceito
  divergindo silenciosamente se um dia só um dos dois for atualizado.
