# Log de Decisões — Fase 1 (Novo Ciclo, web): Pentágono de Qualidade + Filtro de Mando

## DOR → SPEC → PROMPT PLAN — 2026-08-24

- Decisão: componente novo `PentagonoQualidade.tsx` em vez de editar
  `RadarAtributos.tsx` in-place — mantém o histórico de commit
  separando "generalização geométrica pra N eixos" de "recurso novo
  (anéis, sombra, tooltip, overall score)"; `RadarAtributos.tsx` é
  removido só depois de confirmado que nada mais o usa.
- Decisão: polígono da mediana desenhado como pentágono regular de
  raio 50% fixo (constante geométrica), não a partir dos valores
  brutos de `mediana_posicao` — cada eixo já é percentil (0-100), então
  a mediana é sempre 50% em todo eixo, por definição; os valores brutos
  de `mediana_posicao` servem só pro tooltip, não pra desenhar a forma.
- Decisão: filtro de mando (Bloco A do prompt plan) é independente do
  Pentágono e não depende do backend — pode ser implementado e
  shippado primeiro, sem bloquear em cima do trabalho de backend desta
  fase.
- Nota: mesma ressalva de numeração do backend — Fase 1 do *novo
  ciclo*, não a Fase 1 (Fundação) já concluída.

## TDD → BUILD → EVIDÊNCIAS — 2026-08-24

- Decisão: `overall_score` calcula média aritmética simples no frontend caso o payload não traga o valor pronto, garantindo compatibilidade reversa com mocks e endpoints transitórios.
- Decisão: remoção definitiva de `RadarAtributos.tsx` e `RadarAtributos.test.tsx` após validação de substituição completa no `DetalheJogador.tsx`.
- Risco aceito: tooltips acessíveis em SVG via estado React e `role="tooltip"` posicionado com fallback de `aria-label` nos vértices.

## Correção pós-implementação (Antigravity) — 2026-08-24

- Decisão: Overall Score movido de `<div>` HTML posicionado em
  `position: absolute; top/right` (canto do card) para `<g>`/`<text>`
  dentro do próprio `<svg>`, centralizado em `(centroX, centroY)` —
  a implementação original divergia de RF05/CA03 do spec ("número
  central" / "aparece no centro do pentágono"); o teste existente só
  checava `textContent`, nunca a posição, por isso passou com o defeito.
- Decisão: `.overall-badge` (CSS de badge com borda/background) removida
  do `theme.css`; `.overall-value`/`.overall-label` adaptadas de
  `color` para `fill` (SVG `<text>` não usa `color`).

## Ajustes de feedback do usuário — 2026-08-24

- Decisão: Overall Score central mostra só o número (removida a palavra
  "Overall" e o `<text>` de rótulo abaixo); rótulos dos eixos mostram
  `{nome} {valor}` sem o sinal de `%` — pedido explícito do usuário,
  info redundante já que a legenda explica que são percentis.
- Decisão: `viewBox` do SVG alargado de `0 0 340 320` para
  `-20 0 380 320` (margem simétrica de 20px de cada lado) — o rótulo
  "Disciplina" (o mais longo, `text-anchor="end"` em `x=58`) estourava
  a borda esquerda do viewBox original e era cortado pelo
  `overflow: hidden` padrão do SVG (renderizava "sciplina" em vez de
  "Disciplina"). Coordenadas internas (anéis, eixos, polígonos,
  vértices) não mudaram — só a janela de visualização.
- Risco aceito: overall_score continua sendo média aritmética simples
  no backend (sem peso por posição) — usuário vai tratar o peso por
  posição (ex.: Combate pesar menos pra atacante que pra zagueiro/GOL)
  diretamente no repo do backend, fora do escopo desta sessão.

## Layout do topo do DetalheJogador — 2026-08-24

- Decisão: info base (header) e Pentágono agora ficam num grid de 2
  colunas (`.detalhe-topo`, info à esquerda / pentágono à direita,
  `minmax(280px, 420px)` pro pentágono) em vez de empilhados — pedido
  do usuário pra reduzir o quanto o pentágono empurrava a página pra
  baixo. Colapsa pra 1 coluna em `max-width: 820px`, mesmo breakpoint
  já usado em `.matchup-cols` (Fase 7).
- Decisão: "Média básica" adicionada ao header do jogador
  (`atleta.media_basica`) — dado já vinha da API (usado na listagem
  desde a Fase 7), só não era exibido nesta tela.
- Decisão: `align-items: stretch` no grid (era `start`) + moldura do
  cartão movida do `.diagram-wrap` pra `figure` inteira (SVG + legenda)
  — pedido do usuário pra altura dos dois cartões (info base e
  pentágono) ficarem uniformes. Só esticar a altura não bastava: a
  borda visível ficava menor que o card do header porque a legenda
  (`figcaption`) ficava fora do `diagram-wrap` sem moldura. Removido o
  `style={{margin}}` inline de `PentagonoQualidade.tsx` (tinha
  prioridade sobre a regra CSS) e adicionada regra global `figure {
  margin: 0 0 2rem }` como fallback fora do contexto `.detalhe-topo`.
- Bug introduzido pela decisão acima e corrigido na sequência: o
  `height: 100%` explícito em `header`/`figure` (redundante com
  `align-items: stretch`) fazia o box "comer" a própria `margin-bottom`
  em vez de somar a ela — colava os dois cartões direto no `<section>`
  do Raio-X (gap virou 0px). Removido o `height: 100%`; o
  `align-items: stretch` sozinho já iguala as duas colunas sem esse
  efeito colateral na margem. Confirmado via medição real no DOM
  (`getBoundingClientRect`): alturas iguais (438,7px) e gap de 32px
  (as duas margens de 1rem, sem colapsar — mesmo padrão do resto da
  página) restaurado.

## Coluna Overall na listagem de jogadores — 2026-08-24

- Decisão: coluna "Overall" adicionada em `Jogadores.tsx` logo antes de
  "Chance de pontuar" (que o usuário pediu pra manter como última
  coluna) — não no fim da tabela, quebrando o padrão de "sempre
  anexar no final" usado nas colunas anteriores (`media_basica`,
  `chance_pontuar`).
- Decisão: `overall_score: number | null` adicionado ao tipo `Atleta` —
  o campo já vinha pronto do endpoint `/atletas` (calculado no
  backend), só faltava o tipo no cliente. Ordenação segue o mesmo
  padrão de `chance_pontuar_percentual` (`?? -1`, nulo sempre por
  último em qualquer direção) e exibição usa `—` pra nulo (ex.: TEC),
  mesmo padrão visual da coluna de chance de pontuar.
- Bug introduzido pela coluna nova e corrigido na sequência: a tabela
  usa CSS Grid com `grid-template-columns` fixo em 10 trilhas
  explícitas (`.player-row-header, .player-row`). Adicionar a 11ª
  célula (Overall) sem atualizar o grid fazia o auto-placement jogar a
  última coluna ("Chance de pontuar") pra uma linha implícita nova —
  quebrava o alinhamento de cabeçalho e células. Corrigido adicionando
  a 11ª trilha (`88px`, mesmo tamanho das outras colunas numéricas) e
  ajustando `.players-list-inner { min-width }` de 760px pra 848px.
- Segundo bug, mesma raiz: sem `minmax()`, as colunas de Nome/Clube
  (`1.7fr`/`1.1fr`) não têm piso mínimo — quando o grid fica mais
  apertado (a coluna Overall tomou espaço), o `fr` encolhe até o
  min-content da célula, que pra texto quebrável é só a palavra mais
  longa. Resultado: "Léo Condé" quebrava em duas linhas, "Vagner
  Mancini"/"Dorival Júnior" também, deixando a tabela com cara de
  quebrada/espremida à esquerda. Corrigido com
  `minmax(130px, 1.7fr)`/`minmax(64px, 1.1fr)` (nomes cabem numa linha
  só) e `.players-list-inner { min-width }` ajustado pra 1140px —
  a tabela passa a exigir mais scroll horizontal em telas estreitas,
  mas não quebra mais o conteúdo pra caber.
- Ajuste pedido pelo usuário: sem scroll horizontal, cabeçalhos mais
  próximos. Reduzidas as 11 colunas (nome/clube com piso menor,
  colunas numéricas de `88px` pra `66px`, "chance de pontuar" de
  `132px` pra `100px`), `gap` de `0.6rem` pra `0.4rem` e padding
  lateral da linha de `0.85rem` pra `0.6rem`. `.players-list-inner`
  perde o `min-width` fixo (não precisa mais forçar, cabe sem
  scroll). Verificado via `scrollWidth <= clientWidth` no navegador
  (926 ≤ 928) e visualmente: nomes longos ("Vagner Mancini", "Dorival
  Júnior") continuam numa linha só.
- Ajuste pedido pelo usuário: valores numéricos (`.num`) e os rótulos
  de cabeçalho ordenáveis (`.sort-button`) viraram `text-align: left`
  (eram `right`) — cabeçalho e valor passam a alinhar na borda
  esquerda da coluna, em vez da direita.
- Correção do ajuste acima: usuário esclareceu que a direção certa era
  a direita mesmo (o padrão original) — revertido `.num`/`.sort-button`
  pra `text-align: right`. De quebra, corrigido um desalinhamento que
  já existia antes de qualquer mudança desta sessão: a célula de
  "Chance de pontuar" nunca teve a classe `.num` (só o cabeçalho
  alinhava à direita, o valor/badge ficava à esquerda por padrão) —
  adicionada `className="num"` na célula em `Jogadores.tsx` pra
  cabeçalho e valor baterem no mesmo lado.

## Cache local de atletas (spike + implementação) — 2026-08-24

- Spike (pedido do usuário: medir antes de decidir): total de atletas
  no banco = 857; buscar tudo (paginando `page_size=100`, o máximo
  aceito pelo backend) leva ~0,475s sequencial / ~285KB. Descoberta
  paralela: o backend já suporta `sort_by`/`sort_dir` nativo em
  `/atletas`, mas o frontend nunca usava — a ordenação (`useMultiSort`)
  rodava só sobre a página atual de 20 itens, não sobre o dataset
  inteiro (bug de corretude, não só performance).
- Decisão: dataset pequeno demais (857/285KB, <0.5s) pra justificar
  streaming progressivo ("mostra os primeiros, vai completando em
  background") — implementado cache completo em memória:
  `listarTodosAtletas()` (`src/api/atletas.ts`) pagina internamente até
  a última página e retorna tudo de uma vez.
- Decisão: filtro (nome/posição/mando), ordenação e paginação em
  `Jogadores.tsx` passam a rodar 100% client-side sobre o cache — nome
  buscado com `.toLowerCase().includes(...)`, sem round-trip ao backend
  a cada interação. Não usei o `sort_by` do backend (resolver tudo no
  cliente é mais simples e não depende de sincronizar com o outro
  repo); o parâmetro server-side fica disponível pra um cenário futuro
  onde o dataset não caiba mais em memória.
- Risco aceito: cache não expira/não recarrega sozinho — só é buscado
  de novo se a página for recarregada. Se o dado mudar no backend
  (nova rodada, etc.) o usuário só vê a atualização dando refresh.
  Aceitável pro tamanho e a frequência de mudança dos dados hoje; YAGNI
  invalidação automática enquanto não for um problema real.
