# Prompt Plan: Fase 5 (Novo Ciclo) — Matriz de Capitão & Live Radar (web)

**Spec:** `docs/specs/spec-fase5-matriz-capitao-live.md`

## Ordem de Implementação

### Bloco A — Cliente de API (`src/api/otimizador.ts` estendido + `src/api/mercado.ts` novo)

1. [ ] Teste (RED): `buscarMatrizCapitao()` faz `GET
   /otimizador/matriz-capitao` e retorna os 5 candidatos tipados.
2. [ ] Teste (RED): `buscarStatusAlterados(desde: Date)` faz `GET
   /mercado/status-alterados?desde=` (ISO string) e retorna a lista
   tipada.
3. [ ] Teste (RED): `buscarSubstituto(atletaId)` faz `GET
   /otimizador/substituto/{id}`; em 404 retorna `null` (não lança
   exceção — 404 é um resultado válido de "sem substituto", RF04).
4. [ ] Implementação: adicionar `buscarMatrizCapitao`/`buscarSubstituto`
   em `src/api/otimizador.ts` (Fase 4); criar `src/api/mercado.ts` com
   `buscarStatusAlterados`.
5. [ ] Commit: `feat: adiciona cliente de API para matriz de capitao e status ao vivo`.

### Bloco B — `MatrizCapitao.tsx` (depende de A)

6. [ ] Teste (RED): renderiza os 5 candidatos na ordem recebida (CA01
   — sem `.sort()` no cliente).
7. [ ] Teste (RED): o 1º colocado tem um selo/destaque visual distinto
   dos outros 4.
8. [ ] Implementação: `src/components/MatrizCapitao.tsx` — reaproveita
   o componente de raio-X já existente pro próximo confronto de cada
   candidato.
9. [ ] Rodar os testes do Bloco B e confirmar GREEN.
10. [ ] Commit: `feat: adiciona MatrizCapitao com top 5 candidatos`.

### Bloco C — `AlertasMercado.tsx` (depende de A)

11. [ ] Teste (RED): ao montar, chama `buscarStatusAlterados` com a
    hora da montagem como `desde`.
12. [ ] Teste (RED): disparar `visibilitychange` (aba volta ao foco)
    dispara uma nova chamada com o `desde` atualizado pra hora da
    última checagem (CA02) — sem `setInterval` (verificável: nenhum
    timer registrado no teste, só o listener de evento).
13. [ ] Teste (RED): lista vazia de `status-alterados` mostra "nenhuma
    mudança de status desde a última checagem" (RNF03).
14. [ ] Teste (RED): cada atleta alterado mostra um card com o novo
    status e o botão "Ver substituto sugerido"; `buscarSubstituto` só
    é chamado depois do clique nesse botão, não antes (CA03).
15. [ ] Teste (RED): `buscarSubstituto` retornando `null` (404) mostra
    a mensagem de RF04.
16. [ ] Implementação: `src/components/AlertasMercado.tsx`.
17. [ ] Rodar os testes do Bloco C e confirmar GREEN.
18. [ ] Commit: `feat: adiciona AlertasMercado com deteccao de mudanca de status`.

### Bloco D — Navegação e DOD

19. [ ] Teste (RED): links "Matriz de Capitão" e "Alertas" aparecem em
    `Nav.tsx` e apontam pras rotas corretas.
20. [ ] Implementação: adiciona as rotas (mesmo padrão das existentes)
    — `MatrizCapitao` pode viver numa página dedicada ou embutida em
    `Escalador.tsx`/dashboard (decisão de composição de tela, não de
    responsabilidade — sem duplicar lógica de busca).
21. [ ] Rodar a suíte completa e confirmar cobertura ≥ 90%.
22. [ ] Evidências (`docs/evidence/fase5-matriz-capitao-live.md`) e
    checklist de DOD do spec.
23. [ ] Commit final: `docs: evidências e DOD da Fase 5 web (matriz de capitão e live radar)`.

## Dependências

- Depende de `backend/docs/plans/prompt_plan-fase5-matriz-capitao-live.md`
  estar em `main` (4 endpoints novos).
- `MatrizCapitao.tsx` reaproveita o componente de raio-X das Fases
  3b/3d (já em `main`).

## Riscos Identificados

- Risco: sem o backend em `main`, Blocos A-C usam mocks fiéis ao
  contrato do spec backend — integração real só depois do merge.
- Risco: teste de `visibilitychange` pode ser frágil dependendo do
  ambiente de teste (jsdom simula o evento, mas não o estado real de
  visibilidade da aba) — usar `Object.defineProperty(document,
  'visibilityState', ...)` explicitamente no teste, mesmo padrão que
  qualquer outro teste de evento de documento no projeto (verificar se
  já existe precedente antes de inventar um novo jeito).
