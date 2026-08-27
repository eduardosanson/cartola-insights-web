# Log de Decisões: Visualização de Status do Mercado e Modal de Comparação

## Decisão 1: Componente de Status Semântico Reutilizável (`StatusBadge`)
- **Contexto**: O backend expôs `status_id` e `status_nome` (`provavel`, `duvida`, `suspenso`, `contundido`, `nulo`).
- **Decisão**: Criar um componente isolado `StatusBadge.tsx` com estilos CSS dedicados (`.status-badge`, `.status-provavel`, etc.) mapeados para a paleta de cores do sistema (`--accent-home`, `--accent-away`, `--danger`, etc.).
- **Impacto**: O mesmo componente é reutilizado de forma idêntica em `Jogadores.tsx`, `DetalheJogador.tsx` e `ModalCompararJogador.tsx`, garantindo coerência visual sem duplicação de regras.

## Decisão 2: Listagem Resumida no Modal de Comparação
- **Contexto**: O usuário precisa selecionar rapidamente um adversário sem o ruído visual de todas as colunas da listagem completa.
- **Decisão**: Limitar as colunas do modal a: Nome/Clube, Status, Posição, Preço, Média Casa, Média Fora e Overall.
- **Impacto**: A interface fica enxuta, focada e permite comparação ágil e direta.

## Decisão 3: Exclusão Automática do Atleta de Origem
- **Contexto**: Ao abrir o modal a partir de um jogador específico (ex: ID 100), fazê-lo comparar o jogador consigo mesmo geraria uma comparação redundante.
- **Decisão**: O `ModalCompararJogador` filtra e remove automaticamente o `atletaOrigem.id` dos resultados listados.
- **Impacto**: Previne seleções inválidas no comparador.

## Decisão 4: Navegação Direta via Rota Padrão `/comparar`
- **Contexto**: A tela de comparação já suporta parâmetros de query string `/comparar?a={idA}&b={idB}`.
- **Decisão**: Ao clicar em uma linha/jogador no modal, redirecionar diretamente usando `navigate('/comparar?a=' + atletaOrigem.id + '&b=' + atletaSelecionado.id)` e fechar o modal.
- **Impacto**: Reaproveitamento integral da lógica e dos blocos analíticos existentes da Fase 2.

## Decisão 5: Coluna Dedicada e Ícones Compactos de Status
- **Contexto**: Exibir o badge de texto ("Provável", "Dúvida", etc.) dentro da célula de nome ocupava muito espaço horizontal e quebrava o alinhamento visual da tabela.
- **Decisão**: Criar uma coluna dedicada (`St`, 34px) ao lado do nome do jogador exibindo apenas o ícone circular semântico (`iconeApenas`) com tooltip explicativo ao passar o mouse.
- **Impacto**: Ocupa espaço mínimo, mantém o nome do jogador legível em uma única linha e padroniza a visualização tanto na listagem principal (`Jogadores.tsx`) quanto no modal (`ModalCompararJogador.tsx`).

## Decisão 6: Filtros Retráteis em Dropdown com Multi-seleção de Status
- **Contexto**: A quantidade de botões horizontais na toolbar ocupava muito espaço vertical e não permitia selecionar múltiplos status simultaneamente.
- **Decisão**: Criar o componente `DropdownFiltro.tsx` para agrupar opções em menus flutuantes compactos com contadores e suporte a multi-seleção via checkboxes.
- **Impacto**: A toolbar fica limpa, o usuário pode combinar múltiplos status (ex: Provável + Dúvida) e posições simultaneamente, com opção de limpar seleções com 1 clique.
