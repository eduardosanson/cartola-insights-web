# Evidências e DOD: Visualização de Status do Mercado e Modal de Comparação

## Resumo das Entregas

1. **Tipagem e API (`src/api/atletas.ts`)**:
   - Adicionada tipagem `StatusAtletaNome` e suporte a `status_id` e `status_nome` em `Atleta` e `FiltrosAtletas`.
2. **Componente `StatusBadge.tsx`**:
   - Badges semânticos com suporte a ícones compactos (`iconeApenas`) para Provável, Dúvida, Suspenso, Contundido e Nulo.
3. **Componente `DropdownFiltro.tsx`**:
   - Menu retrátil compacto com contadores, suporte a multi-seleção via checkboxes e botão "Limpar".
4. **Componente `ModalCompararJogador.tsx`**:
   - Modal com busca por nome debounced (300ms), filtros em dropdowns (Status e Posição), ordenação por Preço, Média Casa, Média Fora e Overall.
   - Exclusão automática do atleta atual e navegação para `/comparar?a={idA}&b={idB}`.
   - Suporte a teclado (tecla `Escape`, tecla `Enter`/`Espaço` nas linhas).
5. **Listagem de Jogadores (`src/pages/Jogadores.tsx`)**:
   - Exibição de `StatusBadge` em coluna dedicada ao lado do nome.
   - Dropdowns retráteis para Status (multi-seleção), Posição e Mando.
6. **Detalhe do Jogador (`src/pages/DetalheJogador.tsx`)**:
   - Exibição de `StatusBadge` no cabeçalho do atleta.
   - Botão de ação "⚖️ Comparar jogador" abrindo o modal de seleção.

---

## Resultados dos Testes e Cobertura

- **Suíte de Testes:** 39 arquivos de teste, 223 testes passando (100% de aprovação).
- **Cobertura de Código:**
  - Statements: 96.26%
  - Branches: 90.28%
  - Functions: 95.92%
  - Lines: 97.18%
- **Linter (Oxlint):** 0 erros.
- **Build (TypeScript + Vite):** Compilação bem-sucedida (`dist/`).

---

## Checklist de Definition of Done (DOD)

- [x] Especificação técnica (`docs/specs/spec-modal-comparacao-detalhe-jogador.md`) aprovada.
- [x] Plano de implementação (`docs/plans/prompt_plan-modal-comparacao-detalhe-jogador.md`) executado via TDD.
- [x] Testes unitários do modal (`ModalCompararJogador.test.tsx`) implementados e passando.
- [x] Testes integrados de `DetalheJogador.test.tsx` e `Jogadores.test.tsx` atualizados e verdes.
- [x] Componentes integrados ao layout e design system em `theme.css`.
- [x] Suíte completa de testes (`npm run test`) passando.
- [x] Cobertura de testes (`npm run coverage`) ≥ 90% para todas as métricas.
- [x] Lint sem erros (`npm run lint`).
- [x] Build de produção (`npm run build`) validado.
- [x] Evidências e decisões registradas em `docs/`.
