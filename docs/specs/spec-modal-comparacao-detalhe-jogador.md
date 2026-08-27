# Spec: Visualização de Status do Mercado e Modal de Comparação no Detalhe do Jogador

## Contexto de Negócio

Recentemente, o backend implementou e documentou melhorias em `GET /atletas` e `GET /atletas/{id}` (`docs/specs/spec-filtro-status-mercado-clubes.md`), trazendo:
1. **Exclusão de atletas inativos por padrão** e exposição do status de mercado oficial do Cartola FC (`status_id` e `status_nome`: Provável, Dúvida, Suspenso, Contundido, Nulo).
2. **Suporte a multi-filtros** por status e clube.

No frontend, precisamos atender a duas necessidades complementares:
1. **Exibição e Filtragem de Status de Mercado**:
   - Visualização visual clara (badges estilizados) do status do atleta na listagem (`/jogadores`), na tela de detalhe (`/jogadores/:id`) e no modal de comparação.
   - Filtro rápido por status do atleta na listagem de jogadores (ex.: ver apenas "Prováveis").
2. **Modal de Comparação a partir do Detalhe do Jogador**:
   - Um botão de ação na tela de detalhe que abre um modal interativo de seleção de adversário com listagem enxuta (Nome, Clube, Status, Posição, Preço, Média Casa, Média Fora, Overall).
   - Ao clicar em um jogador, navega para a comparação padrão (`/comparar?a={idOrigem}&b={idEscolhido}`).

---

## Decisão de Arquitetura

1. **Tipagem e API (`src/api/atletas.ts`)**:
   - Expandir a interface `Atleta` com `status_id: number | null` e `status_nome: StatusAtletaNome | null`.
   - Criar tipo `export type StatusAtletaNome = 'provavel' | 'duvida' | 'suspenso' | 'contundido' | 'nulo'`.
   - Atualizar `FiltrosAtletas` para suportar `status_id?: number[]` e `clube_id?: number | number[]`.

2. **Componente Reutilizável de Status (`src/components/StatusBadge.tsx`)**:
   - Criação de `StatusBadge.tsx` que recebe `status_nome` (e opcionalmente `status_id`) e renderiza uma tag visual acessível com cores semânticas padronizadas:
     - `provavel`: Verde (`--accent-home` / `#22c55e`)
     - `duvida`: Amarelo / Âmbar (`#eab308`)
     - `suspenso`: Laranja (`#f97316`)
     - `contundido`: Vermelho (`#ef4444`)
     - `nulo`: Cinza (`#6b7280`)
     - `fora_mercado` / `null`: Cinza escuro ou traço

3. **Listagem Principal (`src/pages/Jogadores.tsx`)**:
   - Exibir `StatusBadge` junto aos dados do atleta.
   - Toolbar com filtro rápido por status (ex.: Provável, Dúvida, Suspenso, etc.).

4. **Componente `ModalCompararJogador.tsx`**:
   - Modal acessível (`role="dialog"`, `aria-modal="true"`, fechamento com tecla `Escape`).
   - Carrega `listarTodosAtletas()`, exclui o atleta de origem (`atletaOrigem.id`).
   - Contém busca com debounce (300ms), filtro de posição e ordenação.
   - Exibe apenas as colunas essenciais: Nome & Clube, Status, Posição, Preço, Média Casa, Média Fora, Overall.
   - Ao clicar na linha, executa `navigate('/comparar?a=${atletaOrigem.id}&b=${atletaSelecionado.id}')`.

5. **Integração no Detalhe (`src/pages/DetalheJogador.tsx`)**:
   - Exibe `StatusBadge` no cabeçalho do jogador.
   - Adiciona botão "Comparar jogador" que controla o estado `modalCompararAberto`.

---

## Requisitos Funcionais

- **RF01 (Tipos e API)**: Atualizar `Atleta` com `status_id` e `status_nome` em `src/api/atletas.ts`.
- **RF02 (StatusBadge)**: Criar `StatusBadge.tsx` cobrindo todas as variantes de status com rótulos amigáveis ("Provável", "Dúvida", "Suspenso", "Contundido", "Nulo").
- **RF03 (Visualização em Jogadores)**: Renderizar o status do atleta na listagem de jogadores (`Jogadores.tsx`) e permitir filtragem por status.
- **RF04 (Visualização em DetalheJogador)**: Renderizar o `StatusBadge` no topo de `DetalheJogador.tsx`.
- **RF05 (Botão de Comparação)**: Incluir botão "Comparar jogador" no topo de `DetalheJogador.tsx`.
- **RF06 (Modal de Comparação)**: Implementar `ModalCompararJogador.tsx` com:
  - Busca por nome (debounced 300ms)
  - Chips de posição para filtro
  - Colunas resumidas (Nome/Clube, Status, Posição, Preço, Média Casa, Média Fora, Overall)
  - Ordenação por Preço, Médias e Overall
  - Exclusão automática do atleta de origem
  - Fechamento por botão (✕), clique no backdrop ou tecla `Escape`
- **RF07 (Navegação para Comparação)**: Ao selecionar um atleta no modal, navegar para `/comparar?a={idOrigem}&b={idEscolhido}`.

---

## Requisitos Não-Funcionais

- **RNF01**: Cobertura de testes ≥ 90% em todos os componentes novos e modificados.
- **RNF02**: Acessibilidade: modal com foco gerenciado, `aria-modal="true"`, `role="dialog"` e suporte a `Escape`.
- **RNF03**: Design System e CSS: estilos integrados com as variáveis do tema (`--accent-home`, `--bg-surface`, `--text-muted`, etc.).
- **RNF04**: Performance: filtros executados em memória no cliente com resposta < 16ms.

---

## Critérios de Aceite

- **CA01**: Na lista `/jogadores`, atletas com `status_nome: "provavel"` exibem badge verde "Provável", e é possível filtrar a lista pelo status.
- **CA02**: Na página `/jogadores/:id`, o status do atleta é exibido ao lado do clube e posição.
- **CA03**: Na página `/jogadores/:id`, o botão "Comparar jogador" abre o modal de seleção.
- **CA04**: O modal de seleção lista os atletas disponíveis (exceto o próprio jogador exibido), com campos resumidos (Nome/Clube, Status, Posição, Preço, Média Casa, Média Fora, Overall).
- **CA05**: Digitar no campo de busca do modal filtra instantaneamente após debounce.
- **CA06**: Clicar em um atleta no modal redireciona para `/comparar?a={idAtual}&b={idEscolhido}`.
- **CA07**: Pressionar `Escape` ou clicar no botão fechar fecha o modal.

---

## Definition of Done (DOD)

- [ ] `src/api/atletas.ts` atualizado com tipagem de status.
- [ ] `src/components/StatusBadge.tsx` e testes unitários criados e verdes.
- [ ] `src/components/ModalCompararJogador.tsx` e testes unitários criados e verdes.
- [ ] `src/pages/Jogadores.tsx` atualizado com status e testes passando.
- [ ] `src/pages/DetalheJogador.tsx` atualizado com status, botão e modal de comparação, com testes passando.
- [ ] Suíte completa (`npm run test`) com 100% dos testes passando.
- [ ] Linter (`npm run lint`) sem erros.
- [ ] Build de produção (`npm run build`) validado.
- [ ] Evidências documentadas em `docs/evidence/modal-comparacao-detalhe-jogador.md`.
