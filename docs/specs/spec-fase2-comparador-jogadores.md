# Spec: Fase 2 (Novo Ciclo) — Comparador de Dois Jogadores

## Contexto de Negócio

Uma das principais dores dos cartoleiros em todas as rodadas é a
**dúvida entre dois atletas** da mesma posição (ou de posições
correlatas): *"Escalo o Atleta A ou o Atleta B?"*. Hoje o usuário
precisa abrir duas abas do `DetalheJogador` e alternar manualmente
para comparar Pentágono de Qualidade, raio-X de confronto e perfil de
risco.

A Fase 2 entrega a tela de **Comparador de Dois Jogadores**
(`/comparar`), permitindo a seleção de dois atletas e o confronto
direto de 3 blocos analíticos já existentes no produto:

1. **Pentágono Dual Sobreposto** — os dois polígonos de 5 eixos
   (entregues na Fase 1) desenhados no mesmo SVG, um por atleta.
2. **Raio-X de Confronto Comparado** — mando da rodada, adversário e
   selo de veredito de cada um, lado a lado.
3. **Perfil de Risco Lado a Lado** — classificação de volatilidade e
   distribuição de retorno direto vs. participação.

**Nota de numeração**: histórico de nomes deste spec — nasceu como
`spec-fase3f-comparador-jogadores.md` (sub-numeração `3a-3f` do ciclo
anterior), foi renomeado para `spec-fase2-comparador-jogadores.md` ao
adotar a numeração do `roadmap.html`, e vivia em `backend/` cobrindo
backend+web. Nesta revisão (2026-08-25) descobrimos que a Fase 2 não
precisa de nenhuma mudança de backend (ver Decisão de Arquitetura
abaixo) — o spec migra para `web/`, único repo com trabalho real
nesta fase. Arquivo espelho em `backend/` foi removido; decisão
registrada em `backend/docs/decisions/fase2-comparador-jogadores.md`.

## Decisão de Arquitetura — Sem Mudança de Backend

O backend já expõe tudo que o comparador precisa, por atleta:
`buscarAtleta(id)`, `buscarPercentisAtleta(id)`,
`buscarRaioXConfronto(id)`, `buscarPerfilRiscoAtleta(id)` (todas em
`src/api/`). Em vez de um endpoint dedicado
`GET /atletas/comparar?a=&b=`, o Comparador dispara as 4 chamadas para
cada atleta **em paralelo no cliente** (8 chamadas via
`Promise.allSettled`, não `Promise.all` — a falha de um atleta não
pode derrubar o outro). Um endpoint de agregação seria só uma camada
de reempacotamento sem lógica nova (YAGNI); revisitar apenas se
performance real de rede virar problema.

## Requisitos Funcionais

- RF01: Rota dedicada `/comparar` acessível pela navegação superior
  (`Nav.tsx`).
- RF02: Suporte a parâmetros via query string (`/comparar?a=123&b=456`),
  lidos com `useSearchParams`, permitindo compartilhamento direto e
  links de atalho vindos de `/jogadores` e `/atletas/:id`.
- RF03: Seletor de busca por atleta (novo componente
  `AtletaAutocomplete.tsx`) para os campos A e B — reaproveita
  `listarTodosAtletas()` (já usado como cache local em `Jogadores.tsx`)
  e o mesmo padrão de filtro por nome debounced; não existe hoje um
  componente de autocomplete compartilhado, este é o primeiro.
- RF04: Filtro inteligente de posição: ao selecionar o Atleta A, o
  seletor do Atleta B prioriza atletas da mesma posição por padrão,
  com opção de desmarcar para comparar posições diferentes (ex.: MEI
  vs. ATA).
- RF05: **Pentágono Dual** (`PentagonoDual.tsx`) — variante de
  `PentagonoQualidade.tsx` (Fase 1) que recebe dois `PercentisAtleta` e
  desenha dois polígonos sobrepostos no mesmo SVG (verde = Atleta A,
  âmbar = Atleta B, mesma paleta `--accent-home`/`--accent-away` do
  resto do produto), com legenda e vértices interativos dos dois.
  Reaproveita `calcularPonto`/anéis/eixos já validados na Fase 1 — não
  recalcula geometria do zero.
- RF06: **Tabela Comparativa Head-to-Head** — destaque visual (badge)
  para o vencedor em cada métrica (maior média no mando, mais
  desarmes/finalizações etc.), usando os mesmos `brutos.*` já expostos
  por `buscarPercentisAtleta`.
- RF07: **Bloco Raio-X Lado a Lado** — próximo adversário de cada um,
  mando, o que o rival cede pra posição e o selo de veredito
  (`Veredito`: `referencia_do_time` | `contribuicao_dividida` |
  `pontuacao_diluida`), consumindo `buscarRaioXConfronto`.
- RF08: **Bloco Perfil de Risco Lado a Lado** — classificação
  (`ClassificacaoRisco`: `baixo`/`medio`/`alto`) e distribuição de
  retorno direto vs. participação, consumindo
  `buscarPerfilRiscoAtleta`.
- RF09: Botão "Inverter Atletas" troca A ↔ B instantaneamente (troca
  local de estado, sem novas chamadas de rede).

## Requisitos Não-Funcionais

- RNF01: Testes ≥ 90% de cobertura (padrão do projeto).
- RNF02: Renderização do SVG dual sem layout shift — mesmo cuidado de
  `max-width`/`height:auto` corrigido na Fase 7.
- RNF03: Totalmente responsivo — em telas pequenas os blocos empilham
  verticalmente mantendo legibilidade.
- RNF04: Estado de carregamento por atleta é independente
  (`carregando | ok | erro-parcial`) — um atleta lento ou com erro não
  trava a exibição do outro.

## Critérios de Aceite

- CA01: Dado o acesso a `/comparar?a=123&b=456`, quando a página
  carrega, então os dois atletas são buscados e exibidos lado a lado
  sem interação extra do usuário.
- CA02: Dado dois atletas da mesma posição com percentis calculados, o
  Pentágono Dual desenha dois polígonos no mesmo gráfico com os 5
  rótulos daquela posição.
- CA03: Dado que um dos atletas é goleiro e o outro é jogador de
  linha, o comparador cai para exibição lado a lado com aviso em vez
  de sobrepor eixos incompatíveis.
- CA04: O botão "Inverter Atletas" troca A e B instantaneamente, sem
  refazer as chamadas de rede.
- CA05: Dado que um dos atletas não tem `percentis` calculados (dados
  insuficientes), o pentágono dele mostra fallback "dados
  insuficientes" e o do outro atleta continua renderizando
  normalmente (RNF04).

## Definition of Done (DOD)

- [ ] Código implementado e compilando
- [ ] Testes escritos e passando, cobertura ≥ 90%
- [ ] Lint sem erros
- [ ] Evidências capturadas (`docs/evidence/fase2-comparador-jogadores.md`)
- [ ] Passo a passo de validação humana escrito
- [ ] Integrado em `main`

## Fora de Escopo

- Endpoint dedicado de agregação no backend — decisão explícita desta
  fase (ver Decisão de Arquitetura); revisitar só se performance virar
  problema real.
- Comparação de mais de 2 atletas simultaneamente — YAGNI, não pedido.
- Persistir/compartilhar comparações salvas (além do link via query
  string) — fora de escopo.
