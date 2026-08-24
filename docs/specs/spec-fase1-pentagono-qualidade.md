# Spec: Fase 1 (Novo Ciclo) — Pentágono de Qualidade + Filtro de Mando

## Contexto de Negócio

Continuação de `backend/docs/specs/spec-fase1-pentagono-qualidade.md` —
o radar de 4 eixos (`RadarAtributos.tsx`, Fase 3b) vira um pentágono de
5 eixos com anéis de referência, sombra da mediana da posição, tooltip
com valor bruto e Overall Score. Empacotado com um ajuste de UX
independente no filtro de mando da lista de jogadores.

**Nota de numeração**: mesma ressalva do spec backend — é a Fase 1 do
*novo ciclo* (`roadmap.html`), não a Fase 1 (Fundação) já concluída.

## Requisitos Funcionais — Pentágono

- RF01: Novo componente `PentagonoQualidade.tsx` substitui
  `RadarAtributos.tsx` em `DetalheJogador.tsx` — 5 eixos (não mais 4),
  reaproveitando a função de posicionamento por ângulo já genérica
  (`pontoEixo(indice, total, ...)`, já aceita `total` variável).
- RF02: 4 anéis de referência concêntricos (25/50/75/100%) — poligonais
  estáticas, mesmo raio máximo do polígono do jogador.
- RF03: Polígono tracejado da mediana da posição (dado
  `mediana_posicao` do backend, convertido pra percentual: cada eixo da
  mediana é sempre 50% por definição — a forma some ser um pentágono
  regular só quando os 5 eixos tiverem a mesma escala; como cada eixo é
  independente, o polígono da mediana é sempre o pentágono regular de
  raio 50%. Decisão: desenhar como constante geométrica (não precisa
  dos valores brutos de `mediana_posicao` pra desenhar a forma — só
  precisa deles pro tooltip).
- RF04: Tooltip por vértice (hover/foco) mostrando rótulo + valor bruto
  (`brutos.*`) + percentil — `title` nativo é insuficiente pra 3 linhas
  de informação; usar um elemento posicionado (`role="tooltip"`,
  `aria-describedby` no vértice).
- RF05: Overall Score (0-100) exibido como número central grande,
  vindo pronto do backend (`overall_score`) — sem recalcular no
  cliente.
- RF06: Atleta TEC ou com dados insuficientes mantém o comportamento
  de erro já existente (mensagem informativa, sem quebrar a página) —
  RF06/CA da Fase 3b, sem regressão.

## Requisitos Funcionais — Filtro de Mando

- RF07: Remove o botão "Todos" do grupo de filtro de mando em
  `Jogadores.tsx`. Restam só "Casa" e "Fora".
- RF08: "Casa" e "Fora" viram toggle desselecionável — clicar no botão
  já ativo desmarca (`mando` volta a `''`/`undefined`, mesmo efeito de
  "Todos" hoje) — mesmo padrão de toggle já usado nos chips de posição
  (`togglePosicao`).
- RF09: Nenhuma mudança no contrato com a API — o parâmetro `mando`
  continua sendo `'casa' | 'fora' | undefined`, só a UI que perde o
  terceiro estado explícito.

## Requisitos Não-Funcionais

- RNF01: Testes ≥ 90% de cobertura.
- RNF02: Pentágono responsivo — mesmo comportamento de
  `max-width`/`height:auto` já corrigido na Fase 7 (bug do radar
  gigante), não repetir o mesmo erro.

## Critérios de Aceite

- CA01: Dado um atleta ZAG/LAT/MEI/ATA/GOL com percentis calculados,
  quando `DetalheJogador` carrega, então o SVG mostra 5 vértices (não
  4) rotulados corretamente pra posição.
- CA02: Passar o mouse/focar um vértice mostra o valor bruto e o
  percentil daquele eixo especificamente.
- CA03: O número do Overall Score aparece no centro do pentágono,
  igual ao `overall_score` que a API retornou.
- CA04: Clicar em "Casa" filtra só mandantes; clicar em "Casa" de novo
  (já ativo) volta a mostrar todos os atletas — sem precisar de um
  terceiro botão.
- CA05: Não existe mais nenhum botão com o texto "Todos" no filtro de
  mando.

## Definition of Done (DOD)

- [ ] Código implementado e compilando
- [ ] Testes escritos e passando, cobertura ≥ 90%
- [ ] Lint sem erros
- [ ] Evidências capturadas (`docs/evidence/fase1-pentagono-qualidade.md`)
- [ ] Passo a passo de validação humana escrito
- [ ] Integrado em `main`

## Fora de Escopo

- Comparador dual (Pentágono sobreposto de 2 atletas) — Fase 2 do
  roadmap, repo/componente separado (`PentagonoDual.tsx`).
- Animação de entrada do SVG — não pedido, YAGNI.
- Mudança de posição/tamanho do pentágono em telas pequenas além do
  `max-width` já padrão — sem breakpoint dedicado nesta fase.
