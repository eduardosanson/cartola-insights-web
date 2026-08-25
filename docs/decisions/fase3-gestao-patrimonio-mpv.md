# Log de Decisões — Fase 3 (Novo Ciclo, web): Gestão de Patrimônio & MPV

## DOR → SPEC — 2026-08-25

- Decisão: simulador calcula `variacao_estimada = a·pontos + b` no
  cliente usando os coeficientes já devolvidos por `GET
  /atletas/{id}/mpv` — evita uma chamada de rede por movimento do
  slider (RNF02); o backend nunca recalcula a reta em tempo real, só
  entrega os coeficientes já materializados.
- Decisão: todo MPV exibido carrega o selo "estimativa baseada em
  dados históricos" de forma permanente (não em tooltip) — decisão de
  produto pra nunca deixar o usuário confundir com número oficial do
  Cartola (que não existe publicamente).
- Decisão: simulador avulso reaproveita `AtletaAutocomplete.tsx` da
  Fase 2 em vez de duplicar busca de atleta.

## SPEC → PROMPT PLAN — 2026-08-25

- Decisão: gráfico da curva de transição é SVG artesanal (mesmo
  princípio de `PentagonoQualidade`/`PentagonoDual`), sem lib de
  charting nova — consistente com o resto do produto, que não usa
  nenhuma lib de gráficos até agora.
- Decisão: Blocos A-D deste plano não bloqueiam em esperar o backend
  da Fase 3 mergeado — usam mocks fiéis ao contrato do spec backend;
  só o Bloco E (integração final) e a validação manual dependem do
  merge real.

## TDD → ENTREGA — 2026-08-25

- Decisão: os 404 do backend por ausência de preço histórico ou de
  faixas materializadas são estados de “dados insuficientes” na UI, não
  erros fatais. O contrato backend possui esses dois caminhos além do
  `200` com `confiavel: false`.
- Decisão: `formatCurrency` centraliza a representação em `C$` com duas
  casas decimais; os componentes de MPV e simulador não duplicam regra
  de formatação.
- Decisão: a curva recebe pontos já carregados pela página e não presume
  rodadas contíguas. O SVG trata lista vazia, ponto único e domínio
  constante sem gerar `NaN`/`Infinity`.
- Decisão: como não existe API/modelo de elenco salvo no produto atual,
  a página entrega o caminho previsto no RF06 para ausência de elenco:
  curva geral e simulador avulso com o `AtletaAutocomplete` existente.
- Evidência: 165 testes passaram; cobertura global de 97,95% statements,
  91,21% branches, 99,51% functions e 99,22% lines; build e lint sem
  erros.

## Revisão pré-entrega — 2026-08-25

- Correção: o simulador trata tanto `confiavel: false` quanto
  `mpv_estimado: null` como dados insuficientes, inclusive quando esses campos
  vierem inconsistentes entre si. O slider nunca é exibido com MPV nulo.
- Correção: o conteúdo do detalhe é remontado pela chave da rota ao trocar
  `/jogadores/:id`, limpando atleta, histórico e blocos analíticos enquanto as
  novas requests carregam. Isso impede exibir MPV ou erro do jogador anterior.
