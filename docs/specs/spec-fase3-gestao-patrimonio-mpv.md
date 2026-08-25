# Spec: Fase 3 (Novo Ciclo) — Gestão de Patrimônio & MPV (web)

## Contexto de Negócio

Continuação de `backend/docs/specs/spec-fase3-gestao-patrimonio-mpv.md`
— o backend expõe `GET /atletas/{id}/mpv` (MPV estimado + coeficientes
da reta da faixa de preço) e `GET /mercado/curva-valorizacao` (variação
média histórica por rodada). Esta fase entrega a UI: o selo de MPV no
detalhe do atleta, o simulador interativo de ganho/perda de cartoletas
e o gráfico da curva de transição estratégica (rodadas 1-5 em
destaque).

**Importante**: o MPV é sempre uma **estimativa** baseada em dado
histórico — o Cartola não publica a fórmula oficial. Toda exibição do
MPV precisa deixar isso explícito na UI (RF01), nunca apresentar como
número oficial.

## Requisitos Funcionais

- RF01: Em `DetalheJogador.tsx`, bloco de patrimônio mostra o
  `mpv_estimado` do atleta com selo "estimativa baseada em dados
  históricos" sempre visível ao lado do número — não só em tooltip.
- RF02: Quando `confiavel: false` (ou `mpv_estimado: null`), a UI
  mostra "dados insuficientes ainda para estimar" em vez de esconder o
  bloco ou mostrar um número — nunca falha silenciosamente nem exibe
  `null`/`NaN`.
- RF03: **Simulador de Valorização** (`SimuladorValorizacao.tsx`) —
  slider de pontuação projetada (0 a ~20, mesmo range de pontuação
  usado no resto do produto); a cada mudança, calcula
  `variacao_estimada = coef_a * pontos + coef_b` no cliente usando os
  `coeficientes` já retornados por `GET /atletas/{id}/mpv` (sem chamar
  o backend de novo a cada movimento do slider).
- RF04: O simulador mostra o resultado em C$ (não só a variação bruta),
  formatado com o mesmo padrão de moeda já usado pra `preco_num` no
  resto do app.
- RF05: **Curva de Transição Estratégica** — gráfico de linha
  (`variacao_media` por `rodada`, de `GET
  /mercado/curva-valorizacao`) na tela de patrimônio, com as rodadas
  1-5 destacadas visualmente (ex.: faixa sombreada de fundo) e uma nota
  textual explicando por que focar em valorização nessas rodadas
  destrava poder de compra pro resto do campeonato.
- RF06: Tela nova `Patrimonio.tsx` (rota `/patrimonio`) que reúne o
  simulador do elenco do usuário (se autenticado — reaproveita
  `AuthContext` já existente) e a curva de transição; sem elenco
  salvo, mostra a curva geral e um simulador "avulso" (usuário escolhe
  qualquer atleta via `AtletaAutocomplete.tsx`, componente da Fase 2).

## Requisitos Não-Funcionais

- RNF01: Testes ≥ 90% de cobertura.
- RNF02: Simulador não faz nenhuma chamada de rede durante a
  interação do slider — só na carga inicial da página (RF03).
- RNF03: Gráfico da curva de transição segue o mesmo padrão de
  responsividade (`max-width: 100%; height: auto`) já usado nos SVGs
  do produto (Fase 1/2) — sem novo padrão de dimensionamento.

## Critérios de Aceite

- CA01: Dado um atleta com `confiavel: true`, o detalhe do jogador
  mostra o MPV com o selo de estimativa visível.
- CA02: Dado um atleta com `confiavel: false`, aparece a mensagem de
  dados insuficientes, sem número quebrado.
- CA03: Mover o slider do simulador de 0 a 20 pontos atualiza o valor
  em C$ instantaneamente, sem nenhuma chamada de rede adicional
  (verificável por mock do `fetch`/`buscarMpv` sendo chamado uma única
  vez).
- CA04: O gráfico da curva de transição mostra uma faixa visualmente
  destacada cobrindo as rodadas 1 a 5.
- CA05: Reaproveita `AtletaAutocomplete.tsx` (Fase 2) no simulador
  avulso — nenhum componente de busca duplicado.

## Definition of Done (DOD)

- [ ] Código implementado e compilando
- [ ] Testes escritos e passando, cobertura ≥ 90%
- [ ] Lint sem erros
- [ ] Evidências capturadas (`docs/evidence/fase3-gestao-patrimonio-mpv.md`)
- [ ] Passo a passo de validação humana escrito
- [ ] Integrado em `main`

## Fora de Escopo

- Simular o elenco completo do usuário rodada a rodada (projeção
  multi-rodada) — só a rodada corrente/projetada; simulação
  encadeada fica para uma fase futura se houver demanda.
- Qualquer alegação de MPV "oficial" — sempre rotulado como estimativa
  (RF01/RF02).
- Persistir simulações salvas — fora de escopo, mesma decisão da Fase 2
  sobre comparações.
