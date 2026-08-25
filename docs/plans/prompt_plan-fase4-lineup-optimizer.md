# Prompt Plan: Fase 4 (Novo Ciclo) — Lineup Optimizer (web)

**Spec:** `docs/specs/spec-fase4-lineup-optimizer.md`

## Ordem de Implementação

### Bloco A — Cliente de API (`src/api/otimizador.ts`, novo)

1. [ ] Teste (RED): `buscarEsquemasTaticos()` faz `GET
   /otimizador/esquemas` e retorna a lista tipada.
2. [ ] Teste (RED): `montarEscalacaoOtima({orcamento, esquema, modo})`
   faz `POST /otimizador/escalar` e retorna `EscalacaoOtima` tipada;
   em caso de `422`, lança um erro tipado (`EscalacaoInviavelError` ou
   similar) com a mensagem do backend, não um erro genérico de fetch.
3. [ ] Implementação: `src/api/otimizador.ts` — mesmo padrão de
   `src/api/mpv.ts` (Fase 3).
4. [ ] Commit: `feat: adiciona cliente de API para o otimizador de escalação`.

### Bloco B — Formulário (depende de A)

5. [ ] Teste (RED): formulário renderiza os esquemas vindos de
   `buscarEsquemasTaticos()` (não uma lista hardcoded) e os 3 modos
   com a frase explicativa de cada um.
6. [ ] Teste (RED): submeter chama `montarEscalacaoOtima` com os
   valores do formulário.
7. [ ] Implementação: `src/pages/Escalador.tsx` — formulário +
   estado de carregamento (RNF03).
8. [ ] Rodar os testes do Bloco B e confirmar GREEN.
9. [ ] Commit: `feat: adiciona formulario de otimizacao de escalacao`.

### Bloco C — Campo tático visual (depende de B)

10. [ ] Teste (RED): dado uma `EscalacaoOtima` de exemplo, o campo
    tático organiza os atletas em linhas por posição (GOL, defesa,
    meio, ataque) — não uma lista plana.
11. [ ] Teste (RED): cada atleta mostra nome, preço e
    `pontuacao_esperada` com o rótulo correto pro modo usado (RF03 —
    parametrizar o teste pelos 3 modos).
12. [ ] Teste (RED): clicar num atleta navega pra
    `/atletas/{atleta_id}`.
13. [ ] Implementação: componente `CampoTatico.tsx` (ou seção dentro
    de `Escalador.tsx`, decisão de tamanho do arquivo) — grid
    responsivo por linha de posição (RNF02).
14. [ ] Rodar os testes do Bloco C e confirmar GREEN.
15. [ ] Commit: `feat: adiciona campo tatico visual com escalacao otima`.

### Bloco D — Erros e resumo (depende de B, C)

16. [ ] Teste (RED): resposta `422` (orçamento inviável) mostra a
    mensagem de RF05 — texto pedindo pra aumentar orçamento ou trocar
    esquema, não um erro genérico.
17. [ ] Teste (RED): sucesso mostra `custo_total` vs. orçamento
    informado e `pontuacao_esperada_total` (RF04).
18. [ ] Implementação: bloco de resumo + tratamento de erro em
    `Escalador.tsx`.
19. [ ] Rodar os testes do Bloco D e confirmar GREEN.
20. [ ] Commit: `feat: adiciona resumo de custo/pontuacao e tratamento de erro no escalador`.

### Bloco E — Navegação e DOD

21. [ ] Teste (RED): link "Escalador" aparece em `Nav.tsx` e aponta
    pra `/escalador`.
22. [ ] Implementação: adiciona a rota (mesmo padrão das rotas
    existentes).
23. [ ] Rodar a suíte completa e confirmar cobertura ≥ 90%.
24. [ ] Evidências (`docs/evidence/fase4-lineup-optimizer.md`) e
    checklist de DOD do spec.
25. [ ] Commit final: `docs: evidências e DOD da Fase 4 web (lineup optimizer)`.

## Dependências

- Depende de `backend/docs/plans/prompt_plan-fase4-lineup-optimizer.md`
  estar em `main` (endpoints `GET /otimizador/esquemas` e `POST
  /otimizador/escalar`).

## Riscos Identificados

- Risco: sem o backend em `main`, Blocos A-D usam mocks fiéis ao
  contrato do spec backend, mesma mitigação já usada na Fase 3 web —
  integração real só depois do merge do backend.
- Risco: campo tático visual pode ficar visualmente complexo de
  acertar em telas pequenas (6 esquemas com contagens diferentes por
  linha) — mitigar testando os 6 esquemas manualmente antes de
  considerar RNF02 cumprido, não só o esquema padrão.
