# Log de Decisões — Fase 7 (correção pós-validação humana)

## Systematic debugging → EVIDÊNCIAS — 2026-08-24

Usuário validou a Fase 7 no navegador (backend + web rodando local) e
reportou 3 bugs visuais reais, confirmados por captura de tela antes de
qualquer correção:

- **Cabeçalhos da lista colados** (`Média geralMédia casa...` sem
  espaço): causa raiz é `.sort-button { white-space: nowrap }` (CSS
  pré-existente) forçando o rótulo numa linha só, estourando a coluna de
  68px (dimensionada pro número, não pro rótulo). Corrigido widening as
  colunas numéricas (68px → 80-132px) e permitindo `white-space: normal`
  só nos botões do cabeçalho (não na linha de dados, que continua
  compacta).
- **Losango de atributos gigante**: `<svg viewBox="0 0 300 300">` sem
  `width`/`height` nem CSS de limite — sem isso o navegador estica o SVG
  pra largura do container, virando um losango de milhares de pixels.
  Corrigido com `.radar-wrap svg { max-width: 280px; height: auto }`
  (mesmo princípio da POC, que tinha exatamente essa regra e nunca foi
  portada quando o componente foi criado na Fase 3b).
- **Barra de busca fora do padrão da POC**: nunca tinha sido agrupada
  num toolbar único — campo de busca e os dois grupos de filtro (posição,
  mando) ficavam em 3 linhas soltas sem container visual. Corrigido com
  `.players-toolbar` (flex row) + `.search-field` (ícone + input,
  container próprio) + `.filter-group` (caixa em volta de cada grupo de
  chips), reproduzindo a POC.

Decisão: nenhuma correção mudou o Definition of Done já assinado da Fase
7 original (`spec-fase7-redesign-visual.md`) — são bugs no que já tinha
sido implementado, não requisito novo. Verificação só visual (navegador
real, `docker compose` + `npm run dev`) — não há framework de teste de
regressão visual neste projeto; os 105 testes automatizados continuam
verdes sem alteração de asserções.
