# Evidencias — MVP Web

Data: 2026-08-22

## Funcionalidades validadas

- `/tabela`: consome 20 clubes reais e exibe medias de pontuacao em casa e fora.
- `/jogadores`: lista atletas reais com busca, paginacao e filtros GOL, ZAG, LAT, MEI, ATA e TEC.
- `/jogadores/:id`: consulta resumo e historico reais pela API, inclusive em deep link e refresh.
- Estados de carregamento, vazio e erro sao tratados pelas tres telas.
- Cabecalhos de medias dos clubes e preco/medias dos jogadores alternam
  ordenacao descendente, ascendente e removida.
- Criterios podem ser combinados; setas e numeros exibem direcao e prioridade.
- Precos, medias e pontuacoes exibem no maximo duas casas decimais, enquanto a
  ordenacao preserva a precisao numerica original.
- A lista de jogadores exibe Casa, Fora ou Sem jogo a partir da maior rodada
  sincronizada; o detalhe repete a rodada e o mando do mesmo resumo da API.

## Dados reais observados

- API: `http://127.0.0.1:8000`.
- Web: `http://127.0.0.1:5173`.
- `GET /clubes`: 20 clubes.
- Amostra de `GET /atletas`: Leo Conde (TEC), Fabio (GOL), Thiago Silva (ZAG), Hulk (ATA) e Alan Franco (MEI).
- `GET /atletas/37457`: Leo Conde, REM, preco 7.83, medias geral 4.638, casa 5.396 e fora 3.88.
- `GET /atletas/37457/historico?limit=3`: rodadas 23, 22 e 21 com adversario, mando e pontos.

## Validacao automatizada

```text
npm run lint      -> aprovado
npm run coverage  -> 42 testes aprovados
statements         -> 96.44%
branches           -> 94.11%
functions          -> 94.28%
lines              -> 97.22%
npm run build      -> aprovado, 37 modulos transformados
```

## Integracao real

- `GET /health` retornou 200.
- O frontend e o deep link retornaram 200 e o HTML esperado.
- CORS retornou `access-control-allow-origin: http://localhost:5173`.
- API e PostgreSQL executam via Docker Compose; Vite executa localmente na porta 5173.
- Dados reais da rodada 24 confirmaram Léo Condé/REM fora,
  Fábio/Thiago Silva/Hulk/FLU em casa e Alan Franco/CAM fora.

## Validacao humana

1. Abrir `http://127.0.0.1:5173/tabela` e conferir as medias dos clubes.
2. Abrir `http://127.0.0.1:5173/jogadores`, buscar um nome e alternar filtros de posicao.
3. Abrir um jogador e conferir medias, rodadas, adversarios, mando, pontos e scouts.
4. Recarregar a pagina de detalhe e confirmar que os dados permanecem visiveis.
5. Em clubes, clicar em Media casa e Media fora para combinar criterios; clicar
   novamente para inverter e uma terceira vez para remover cada criterio.
6. Repetir a ordenacao em Preco e medias na tela de jogadores e conferir que
   nenhum valor exibe mais de duas casas decimais.
7. Conferir a coluna Mando na lista e abrir um atleta para validar que o detalhe
   mostra a mesma rodada e o mesmo mando.
