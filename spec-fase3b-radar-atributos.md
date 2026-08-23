# Spec: Fase 3b — Radar de Atributos (web)

## Contexto de Negócio

Consome `GET /atletas/{id}/percentis` (`backend/spec-fase3b-radar-atributos.md`,
já mergeado) pra desenhar um radar SVG de 4 eixos em `DetalheJogador`. Não
é mais o radar de 6 eixos/posição da POC — os 4 indicadores (pontuação
média + 2 específicos da posição + disciplina) foram redesenhados na Fase
3a/backend com base em dado real (`backend/spec-fase3a-percentis-posicao.md`).

## Requisitos Funcionais

- RF01: `DetalheJogador` busca `GET /atletas/{id}/percentis` junto com as
  chamadas que já existem (atleta + histórico), e desenha um radar SVG de
  4 eixos com os valores retornados.
- RF02: Os rótulos dos eixos vêm do **shape da resposta**, não de uma
  tabela de mapeamento no cliente — se a resposta tem `participacao_gol`,
  o eixo se chama "Participação em gol"; se tem `defesas`, se chama
  "Defesas" — um dicionário fixo `{chave da API: rótulo em português}`, não
  uma lógica condicional por posição (a posição já foi decidida no
  backend, o cliente só traduz chave→rótulo).
- RF03: Se o endpoint retornar `404`, a tela mostra uma mensagem no lugar
  do radar (não quebra a página) — texto diferente conforme o motivo
  (RF02/RF03 do spec do backend: "dados insuficientes" vs. "técnico não
  tem radar"), usando o `detail` que já vem pronto do backend.

## Requisitos Não-Funcionais

- RNF01: Cobertura ≥ 90%.
- RNF02: SVG puro (`<svg>`/`<polygon>` no JSX), sem lib de gráficos nova —
  mesmo padrão de "sem lib de estado/gráfico externo" já em uso no projeto
  (`web/CLAUDE.md` herdado do backend: preferir menos indireção).

## Critérios de Aceite

- CA01: Dado um atleta ZAG/LAT/MEI/ATA com percentis, quando a página
  carrega, então o radar mostra 4 eixos: "Pontuação média", "Participação
  em gol", "Desarme", "Disciplina".
- CA02: Dado um GOL com percentis, quando a página carrega, então os eixos
  são "Pontuação média", "Defesas", "Solidez (SG)", "Disciplina".
- CA03: Dado um atleta sem percentil (404 do backend), quando a página
  carrega, então aparece o texto do `detail` no lugar do radar — a página
  não quebra nem fica com um radar vazio/zerado.
- CA04: Dado um atleta com todos os percentis em 100, quando o radar
  desenha, então o polígono toca o anel mais externo em todos os 4 eixos
  (prova visual de que o mapeamento valor→raio está correto, não
  invertido).

## Matemática do radar (4 eixos — não é hexágono como a POC)

Ângulo de cada eixo `i` (0 a 3), começando no topo e girando em sentido
horário: `angulo_i = -90° + i * 90°` (em radianos: `-π/2 + i * π/2`).
Ponto do eixo `i` pro valor `v` (0-100), raio máximo `R`, centro `(cx, cy)`:

```
x = cx + R * (v / 100) * cos(angulo_i)
y = cy + R * (v / 100) * sin(angulo_i)
```

`i=0` → topo, `i=1` → direita, `i=2` → baixo, `i=3` → esquerda. Testado
manualmente (spec, não plano): `v=100` em todos os eixos produz os 4
vértices exatamente sobre o anel de raio `R`; `v=0` em todos produz os 4
vértices no centro (polígono degenerado, ponto único) — CA04 verifica o
primeiro caso.

## Definition of Done (DOD)

- [x] Código implementado e compilando
- [x] Testes escritos e passando, cobertura ≥ 90%
- [x] Lint sem erros
- [x] Evidências capturadas (`docs/evidence/fase3b-radar-atributos.md`)
- [x] Passo a passo de validação humana escrito
- [x] Integrado em `main`
- [x] Roadmap atualizado — seções "3a" e "3b" da Visualização Avançada
      promovidas, **e o SVG de exemplo do radar redesenhado pra 4 eixos**
      (ver `backend/docs/decisions/fase3a-percentis-posicao.md`, seção
      "Atualização do roadmap")

## Fora de Escopo

- Anéis de referência (25/50/75%) desenhados como grade de fundo — a POC
  tinha 3 anéis concêntricos fixos; nesta primeira versão real, um anel
  externo (100%) e os eixos já comunicam a escala, anéis intermediários
  ficam pra se o feedback pedir.
- Animação de entrada do radar.
- Comparação entre dois atletas no mesmo radar (um jogador por vez).
