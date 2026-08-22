# Mando do atleta na rodada atual

## Objetivo

Mostrar na lista e no detalhe de jogadores se o clube do atleta joga em casa,
fora ou nao possui partida na rodada mais recente sincronizada.

## Fonte da rodada

A rodada atual e a maior `partida.rodada` existente no banco. O frontend nao
consulta a API externa nem tenta inferir a rodada pelo relogio.

## Contrato

O resumo retornado por `GET /atletas` e `GET /atletas/{id}` ganha:

- `rodada_atual: number | null`;
- `mando_rodada: 'casa' | 'fora' | 'sem_jogo'`.

Quando nao existir nenhuma partida no banco, `rodada_atual` e `null` e o mando
e `sem_jogo`. Quando houver rodada mas o clube nao estiver em nenhuma partida,
o mando tambem e `sem_jogo`.

## Backend

A query-base de atletas cruza cada clube com as partidas da maior rodada. Clube
mandante produz `casa`, visitante produz `fora` e ausencia produz `sem_jogo`.
Listagem e detalhe reutilizam a mesma query e portanto o mesmo contrato.

## Web

A tabela de jogadores ganha a coluna `Mando`. Casa usa o destaque verde, fora
usa ocre e sem jogo usa cor neutra. O detalhe exibe a rodada e o mando junto aos
dados do atleta.

## Testes

- atleta de clube mandante retorna casa;
- atleta de clube visitante retorna fora;
- clube ausente da rodada retorna sem jogo;
- banco sem partidas retorna rodada nula e sem jogo;
- listagem e detalhe exibem o contrato novo;
- cores e textos da tela correspondem aos tres estados.

## Fora de escopo

- Buscar dinamicamente a rodada na API externa durante uma consulta.
- Exibir adversario ou horario da partida neste incremento.
- Ordenar ou filtrar jogadores por mando.
