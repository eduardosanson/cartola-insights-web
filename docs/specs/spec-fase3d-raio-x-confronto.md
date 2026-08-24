# Spec: Fase 3d — Raio-X de Confronto (web)

## Contexto de Negócio

Consome `GET /atletas/{id}/raio-x` (`backend/spec-fase3d-raio-x-confronto.md`,
já mergeado) pra desenhar os três blocos do raio-X em `DetalheJogador`:
média do jogador no mando do próximo confronto, o que o adversário cede
pra aquela posição/mando, e a participação média do jogador na pontuação
do próprio time — com o selo de veredito (referência do time, contribuição
dividida, pontuação diluída). A tela já mostra `MandoRodada` (mando da
rodada corrente); o raio-X aparece junto, como uma seção nova — não
substitui nada que já existe.

## Requisitos Funcionais

- RF01: `DetalheJogador` busca `GET /atletas/{id}/raio-x` junto com as
  chamadas que já existem (atleta + histórico), e renderiza uma seção
  "Raio-X do confronto" com os três blocos + o selo.
- RF02: Se o endpoint retornar `404`, a seção não aparece — mostra uma
  mensagem curta no lugar (usando o `detail` que já vem pronto do
  backend), sem quebrar o resto da página (histórico continua normal,
  mesmo padrão já usado pro erro de percentis na Fase 3b:
  `web/spec-fase3b-radar-atributos.md`, RF03).
- RF03: `pontos_cedidos_adversario`, `participacao_pontuacao_time_media` e
  `veredito` podem vir `null` mesmo com resposta `200` (RF07/RF01 do spec
  do backend) — cada bloco trata sua própria ausência (ex.: "sem dado
  suficiente" no lugar do número), sem esconder os outros blocos que
  vieram preenchidos.
- RF04: O selo de veredito mostra um rótulo em português por valor:
  `referencia_do_time` → "Referência do time",
  `contribuicao_dividida` → "Contribuição dividida",
  `pontuacao_diluida` → "Pontuação diluída". Dicionário fixo
  `{chave da API: rótulo}` no cliente, mesmo padrão já usado pra rótulos
  de eixo do radar na Fase 3b (RF02 de lá) — não reimplementar a lógica de
  cálculo do veredito no cliente, só traduzir a string que já vem pronta.

## Requisitos Não-Funcionais

- RNF01: Cobertura ≥ 90%.
- RNF02: Sem lib nova — reusa os componentes/padrões já em uso
  (`formatNumber`, tokens de `theme.css`), mesmo princípio de "menos
  indireção" já seguido pelo `RadarAtributos` da Fase 3b.

## Critérios de Aceite

- CA01: Dado um atleta com raio-X disponível (`200` do backend), quando a
  página carrega, então aparecem os rótulos "Média em casa"/"Média fora"
  (conforme o `mando` retornado), o nome do adversário, o quanto ele cede
  na posição, a participação em % e o rótulo do veredito.
- CA02: Dado um atleta sem raio-X (`404` do backend — ex.: técnico, ou
  clube sem confronto agendado), quando a página carrega, então a seção
  do raio-X mostra o texto do `detail` no lugar dos três blocos, e o resto
  da página (cabeçalho, médias, histórico) continua normal.
- CA03: Dado um raio-X com `pontos_cedidos_adversario: null` mas os outros
  campos preenchidos, quando a página carrega, então o bloco "o que o
  adversário cede" mostra um texto de indisponibilidade só naquele bloco —
  os outros dois blocos e o selo continuam aparecendo normalmente.
- CA04: Dado um raio-X com `veredito: null` (participação insuficiente),
  quando a página carrega, então nenhum dos três rótulos de veredito
  aparece — só um texto indicando que não há veredito ainda (não escolhe
  um rótulo por padrão).
- CA05: Dado `mando: "casa"` na resposta, quando a página carrega, então o
  rótulo do primeiro bloco é "Média em casa" (não "Média fora") — o
  cliente decide o rótulo a partir do campo `mando`, não duplica a lógica
  de qual mando o jogador está jogando.

## Modelo de Resposta consumido

```json
// GET /atletas/{id}/raio-x
{
  "atleta_id": 123,
  "posicao": "ATA",
  "rodada": 24,
  "mando": "casa",
  "clube_adversario_id": 267,
  "clube_adversario_nome": "Vasco",
  "media_no_mando": 7.15,
  "pontos_cedidos_adversario": 4.89,
  "participacao_pontuacao_time_media": 12.4,
  "veredito": "referencia_do_time"
}
```

Em `404`: `{"detail": "..."}` — mesmo formato de erro do resto da API.

## Definition of Done (DOD)

- [x] Código implementado e compilando
- [x] Testes escritos e passando, cobertura ≥ 90%
- [x] Lint sem erros
- [x] Evidências capturadas (`docs/evidence/fase3d-raio-x-confronto.md`)
- [x] Passo a passo de validação humana escrito
- [x] Integrado em `main`

## Fora de Escopo

- Qualquer visual de "próxima partida" além do que o raio-X já mostra
  (nome do adversário, mando, rodada) — não é uma tela de calendário, é o
  cruzamento de estatísticas.
- Link/navegação pro perfil do clube adversário a partir do raio-X — pode
  vir depois, não é um requisito desta fase.
- Comparação entre dois jogadores no mesmo raio-X — um jogador por vez,
  mesma decisão já tomada pro radar (Fase 3b).
