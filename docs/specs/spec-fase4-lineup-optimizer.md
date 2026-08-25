# Spec: Fase 4 (Novo Ciclo) — Lineup Optimizer (web)

## Contexto de Negócio

Continuação de `backend/docs/specs/spec-fase4-lineup-optimizer.md` — o
backend expõe `GET /otimizador/esquemas` e `POST /otimizador/escalar`.
Esta fase entrega a tela `Escalador.tsx` (`/escalador`): usuário
informa orçamento e escolhe esquema tático + modo, e vê a escalação
matematicamente ótima montada.

## Requisitos Funcionais

- RF01: Rota `/escalador`, formulário com: campo de orçamento (C$,
  numérico), seletor de esquema tático (populado por `GET
  /otimizador/esquemas` — não hardcoded no cliente) e seletor de modo
  (Liga Clássica / Tiro Curto / Patrimônio), com uma frase curta
  explicando cada modo (o que ele maximiza, em linguagem de produto —
  não a fórmula matemática).
- RF02: Ao submeter, chama `POST /otimizador/escalar` e renderiza a
  escalação num campo tático visual (formação em linhas: GOL, defesa,
  meio, ataque — mesmo princípio visual de formações de futebol já
  comum no domínio, não uma lista simples).
- RF03: Cada atleta na escalação mostra nome, posição, preço e a
  `pontuacao_esperada` (rotulada de acordo com o modo — "média básica"
  na Clássica, "teto estimado" no Tiro Curto, "margem sobre MPV" no
  Patrimônio — não um rótulo genérico igual pros 3 modos).
- RF04: Mostra `custo_total` vs. orçamento informado (ex.: "C$ 97,5 de
  C$ 100,0 — C$ 2,5 sobrando") e `pontuacao_esperada_total`.
- RF05: Quando o backend retorna `422` (orçamento inviável), mostra
  mensagem clara pedindo pra aumentar o orçamento ou trocar de esquema
  — não um erro genérico de rede.
- RF06: Cada atleta na escalação linka pro seu `DetalheJogador.tsx`
  (mesmo padrão de navegação já usado em outras telas).

## Requisitos Não-Funcionais

- RNF01: Testes ≥ 90% de cobertura.
- RNF02: Campo tático visual é responsivo — empilha em mobile mantendo
  a leitura por linha de posição (GOL/defesa/meio/ataque), mesmo
  princípio de RNF03 das Fases 2/3.
- RNF03: Estado de "calculando…" visível durante a chamada (RNF02 do
  backend already garante < 2s, mas a UI não deve parecer travada
  nesse intervalo).

## Critérios de Aceite

- CA01: Preencher orçamento + esquema + modo e submeter mostra os 11
  titulares + técnico organizados por posição no campo tático.
- CA02: O rótulo de `pontuacao_esperada` muda conforme o modo
  selecionado (RF03).
- CA03: Orçamento inviável mostra a mensagem de RF05, não uma tela de
  erro genérica nem um crash.
- CA04: Clicar num atleta da escalação navega pro detalhe dele.

## Definition of Done (DOD)

- [ ] Código implementado e compilando
- [ ] Testes escritos e passando, cobertura ≥ 90%
- [ ] Lint sem erros
- [ ] Evidências capturadas (`docs/evidence/fase4-lineup-optimizer.md`)
- [ ] Passo a passo de validação humana escrito
- [ ] Integrado em `main`

## Fora de Escopo

- Editar manualmente a escalação sugerida (trocar 1 atleta mantendo o
  resto) — a Fase 4 só mostra o ótimo global; edição manual pós-sugestão
  fica pra uma fase futura se houver demanda.
- Salvar/compartilhar escalações montadas — mesma decisão de
  não-persistência do backend.
