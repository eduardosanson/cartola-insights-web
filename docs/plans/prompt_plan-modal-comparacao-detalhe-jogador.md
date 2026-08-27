# Prompt Plan: Visualização de Status do Mercado e Modal de Comparação no Detalhe do Jogador

**Spec:** `docs/specs/spec-modal-comparacao-detalhe-jogador.md`

## Ordem de Implementação

---

### Task 1 — Tipos e Componente `StatusBadge` (TDD)

1. [ ] **Tipos e API**: `src/api/atletas.ts`
   - Adicionar `StatusAtletaNome = 'provavel' | 'duvida' | 'suspenso' | 'contundido' | 'nulo'`.
   - Adicionar campos opcionais/nulos `status_id?: number | null` e `status_nome?: StatusAtletaNome | null` na interface `Atleta`.
   - Atualizar `FiltrosAtletas` para suportar `status_id?: number[]` e `clube_id?: number | number[]`.
   - Atualizar testes de API se necessário em `src/api/atletas.test.ts`.

2. [ ] **Teste (RED)**: `src/components/StatusBadge.test.tsx`
   - Teste: renderiza badge "Provável" com classe/cor de sucesso para status `'provavel'`.
   - Teste: renderiza badges corretos para `'duvida'`, `'suspenso'`, `'contundido'`, `'nulo'`.
   - Teste: lida graciosamente com status nulo/indefinido (retornando `null` ou traço acessível).

3. [ ] **Implementação**: `src/components/StatusBadge.tsx`
   - Componente simples e estilizado com mapeamento semântico de cores.

4. [ ] Executar testes do Task 1 e confirmar **GREEN**.
5. [ ] **Commit**: `feat: adiciona StatusBadge e tipos de status de mercado de atletas`.

---

### Task 2 — Componente `ModalCompararJogador.tsx` (TDD)

6. [ ] **Teste (RED)**: `src/components/ModalCompararJogador.test.tsx`
   - Teste: quando `aberto={false}`, não renderiza conteúdo no DOM.
   - Teste: quando `aberto={true}`, chama `listarTodosAtletas()` e renderiza a lista.
   - Teste: omite da listagem o atleta de origem (`atletaOrigem.id`).
   - Teste: exibe as colunas resumidas: Nome, Clube, Status (`StatusBadge`), Posição, Preço, Média Casa, Média Fora e Overall.
   - Teste: filtro de busca por nome (debounced 300ms).
   - Teste: filtro por chips de posição.
   - Teste: ordenação pelas colunas (Preço, Média Casa, Média Fora, Overall).
   - Teste: ao clicar em um atleta, navega para `/comparar?a=${atletaOrigem.id}&b=${atletaEscolhido.id}` e chama `onFechar()`.
   - Teste: fechar modal através do botão (✕) ou tecla `Escape`.

7. [ ] **Implementação**: `src/components/ModalCompararJogador.tsx`
   - Modal com backdrop, header com título e botão fechar.
   - Barra de pesquisa + `PositionChips`.
   - Tabela compacta com as 6 métricas solicitadas.
   - Integração com `useNavigate` e `useMultiSort`.

8. [ ] Executar testes do Task 2 e confirmar **GREEN**.
9. [ ] **Commit**: `feat: adiciona ModalCompararJogador com listagem simplificada e busca`.

---

### Task 3 — Exibição de Status em `Jogadores.tsx` e Filtro por Status

10. [ ] **Teste (RED)**: `src/pages/Jogadores.test.tsx`
    - Teste: exibe o `StatusBadge` para cada jogador na tabela.
    - Teste: permite filtrar jogadores por status através dos controles na toolbar.

11. [ ] **Implementação**: `src/pages/Jogadores.tsx`
    - Adicionar coluna/célula com `StatusBadge`.
    - Adicionar filtro por status na toolbar de filtros.

12. [ ] Executar testes do Task 3 e confirmar **GREEN**.
13. [ ] **Commit**: `feat: adiciona exibição de status e filtro por status na listagem de jogadores`.

---

### Task 4 — Integração em `DetalheJogador.tsx`

14. [ ] **Teste (RED)**: `src/pages/DetalheJogador.test.tsx`
    - Teste: exibe o `StatusBadge` no cabeçalho do jogador.
    - Teste: exibe o botão "Comparar jogador" no cabeçalho.
    - Teste: clicar no botão "Comparar jogador" abre o modal `ModalCompararJogador`.

15. [ ] **Implementação**: `src/pages/DetalheJogador.tsx`
    - Renderizar `StatusBadge` no bloco de cabeçalho.
    - Adicionar botão de ação "Comparar jogador" estilizado.
    - Renderizar `<ModalCompararJogador>` controlado pelo estado local `modalCompararAberto`.

16. [ ] Executar testes do Task 4 e confirmar **GREEN**.
17. [ ] **Commit**: `feat: integra status e modal de comparação na página de detalhe do jogador`.

---

### Task 5 — Validação Completa, Lint, Build e Evidências

18. [ ] Rodar suíte completa de testes (`npm run test`) e validar 100% de aprovação.
19. [ ] Rodar linter (`npm run lint`).
20. [ ] Rodar build de produção (`npm run build`).
21. [ ] Gerar documentação de decisões e evidências em `docs/decisions/modal-comparacao-detalhe-jogador.md` e `docs/evidence/modal-comparacao-detalhe-jogador.md`.
22. [ ] Commit final: `docs: registra evidências e DOD do modal de comparação e status do atleta`.

---

## Dependências

- `src/api/atletas.ts`: contratos de dados e `listarTodosAtletas()`.
- `src/components/PositionChips.tsx`: filtros de posição.
- `src/hooks/useMultiSort.ts`: ordenação de colunas.
- `src/utils/formatNumber.ts`: formatação numérica.
- `react-router-dom`: roteamento e navegação para `/comparar`.
