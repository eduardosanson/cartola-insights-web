# Ordenacao multipla e formatacao numerica

## Objetivo

Permitir que o usuario ordene times e jogadores por mais de uma metrica e
apresente todos os valores relevantes com no maximo duas casas decimais.

## Interacao

Cada cabecalho ordenavel percorre tres estados a cada clique:

1. descendente;
2. ascendente;
3. removido da ordenacao.

Mais de um cabecalho pode ficar ativo. A prioridade segue a ordem em que os
criterios foram selecionados e aparece junto da seta de direcao.

## Campos ordenaveis

- Times: media casa e media fora.
- Jogadores: preco, media geral, media casa e media fora.

A ordenacao de jogadores atua sobre a pagina recebida da API. Busca, filtros e
paginacao continuam com o comportamento atual.

## Formatacao numerica

Precos, medias e pontuacoes usam no maximo duas casas decimais, sem zeros finais
desnecessarios. A formatacao afeta apenas a exibicao; comparacoes usam os valores
numericos originais para evitar perda de precisao na ordenacao.

## Componentes

- Um hook reutilizavel mantem criterios e produz a colecao ordenada.
- Um cabecalho reutilizavel alterna direcao e comunica prioridade.
- Um formatador numerico centraliza a apresentacao de preco, medias e pontos.

## Testes

- ordenacao simples descendente e ascendente;
- ordenacao combinada respeitando prioridade;
- remocao de um criterio sem perder os demais;
- integracao nas telas de times e jogadores;
- formatacao com zero, uma, duas e mais de duas casas decimais;
- garantia de que a ordenacao usa o valor bruto, nao o texto formatado.

## Fora de escopo

- Ordenacao global no backend entre todas as paginas de jogadores.
- Persistencia da ordenacao entre recargas ou sessoes.
