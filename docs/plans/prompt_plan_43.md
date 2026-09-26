# Prompt Plan: Corrigir ordenação de Overall no comparador (#43)

## Ordem de Implementação

1. [ ] **Escrever teste que reproduz o bug**
   - Teste deve verificar que Overall null aparece PRIMEIRO (bug) em ordem crescente
   - Atletacomscores: 0, 80, null → esperado (crescente): 0, 80, null | atual (bug): null, 0, 80
   - Rodar e confirmar que FALHA (red)

2. [ ] **Remover sentinela de Overall**
   - Em `src/components/ModalCompararJogador.tsx:18`
   - Mudar: `overall_score: (atleta: Atleta) => atleta.overall_score ?? -1`
   - Para: `overall_score: (atleta: Atleta) => atleta.overall_score`
   - Rodar teste de novo e confirmar que PASSA (green)

3. [ ] **Atualizar teste acoplado à sentinela**
   - `ModalCompararJogador.test.tsx:832` — remover/reescrever "usa -1 como valor padrão..."
   - Novo teste: verifica que null sempre vai por último em ambas direções
   - Asserções: crescente (0, null), decrescente (0, null), ambas com null no final

4. [ ] **Rodar suite de testes completa**
   - `skill: cartola-insights-web-test`
   - Confirmar que todos os testes passam e cobertura ≥ 90%

5. [ ] **Rodar build**
   - `skill: cartola-insights-web-build`
   - Confirmar typecheck e build verde

6. [ ] **Capturar evidências**
   - Saída de testes + build (status e coverage)
   - Screenshot/output comprovando bug antes e solução depois

## Dependências
- Depende de merge da #35 (PR #41) para usar mesmo padrão ✓ (já mergeado)

## Riscos Identificados
- Risco mínimo: change é localizada e reutiliza código já validado em `useMultiSort`
- Teste antigo acoplado à sentinela exigirá reescrita, mas é a intenção
