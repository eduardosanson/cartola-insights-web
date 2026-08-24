# Log de Decisões — Fase 7 (Redesign Visual, parte 2)

## DOR → SPEC → TDD → EVIDÊNCIAS — 2026-08-23

- Decisão: a POC de referência não estava em nenhum arquivo do
  repositório — foi recuperada como Artifact publicado
  (`action: list` no MCP de artifacts revelou "Cartola Insights",
  22/08). Sem essa etapa de busca, o redesign teria sido uma
  reinterpretação livre, não uma reprodução fiel — decisão de parar e
  achar a fonte antes de desenhar, em vez de assumir.
- Decisão: linhas da lista de jogadores viram `<Link role="row">`
  (div-grid, não `<table>`) — a POC usa `<button>` clicável por linha
  inteira; escolhido `<Link>` por ser navegação real (funciona com
  botão direito/abrir em nova aba, histórico do navegador), com
  `role="row"`/`role="cell"` explícitos pra preservar a leitura como
  tabela por leitor de tela e manter os testes existentes que usam
  `getAllByRole('row')` sem reescrever a suíte inteira.
- Decisão: `SortableHeader` ganhou prop `as` (`'th' | 'div'`, default
  `'th'`) em vez de duplicar o componente — é reusado em `Tabela.tsx`
  (que continua `<table>`) e agora também em `Jogadores.tsx` (grid).
  Elemento raiz trocável evita HTML inválido (`<th>` fora de `<table>`
  é parseado de forma imprevisível pelo navegador).
- Decisão: veredito → tom do badge mapeado no componente
  (`TOM_VEREDITO`), não pedido ao backend — o backend já resolve a
  *classificação* (`veredito.py`), a *apresentação visual* (cor) é
  responsabilidade do cliente, mesmo princípio dos outros selos
  (`MandoRodada`, `SeloRisco`).
- Decisão: nenhum crest/cor por clube — a POC usa cor fictícia por
  clube (`club.color`) que não existe no modelo de dados real; omitido
  em vez de inventado (mesmo princípio de "indicador real, não
  fictício" já usado nas Fases 3/6).
- Risco aceito: `role="row"` num elemento `<a>` é tecnicamente uma
  combinação pouco comum de ARIA (row normalmente é filho direto de
  rowgroup/table/grid) — mitigado por ser um padrão já usado em
  produção por várias libs de grid acessível, e por preservar a
  navegação por teclado nativa do link (sem precisar reimplementar
  `onKeyDown`/`tabIndex` que um `<div role="row">` clicável exigiria).
