# Evidências — Fase 6 (web): Lista de Jogadores Avançada

Data: 2026-08-23

## Resumo da Feature

`Jogadores` passa a consumir os dois campos novos da Fase 6 backend
(`chance_pontuar_percentual`/`chance_pontuar_classificacao`, expostos em
`GET /atletas`) numa coluna nova da tabela, e ganha um filtro de mando
(Casa/Fora/Todos) que envia `mando` como parâmetro de query — mesmo
padrão de grupo de botões `aria-pressed` dos chips de posição.

## Arquivos Criados e Modificados

`git show 62b1bc1 --stat`:

```text
src/api/atletas.ts                |  4 ++
src/pages/DetalheJogador.test.tsx |  2 ++
src/pages/Jogadores.test.tsx      | 30 +++++++++++++++++
src/pages/Jogadores.tsx           | 27 ++++++++++++++-
4 files changed, 62 insertions(+), 1 deletion(-)
```

1 commit (`62b1bc1`): tipos + parâmetro `mando` no cliente da API,
filtro e coluna na tela de lista, testes.

## Testes, cobertura, build e lint

Suíte completa (`npm test`):

```text
Test Files  22 passed (22)
     Tests  100 passed (100)
```

Cobertura (`npm run coverage`):

```text
All files       |  95.71 |    92.45 |   95.93 |   97.26
Jogadores.tsx   |  92.72 |    94.87 |    86.2  |   91.48   (15-16, 126-131: erro de rede sem `err` tipado e paginação com filtro de mando ativo, não exercitados isoladamente)
atletas.ts      |  94.44 |    94.11 |    100   |    100    (46: branch de query sem nenhum parâmetro)
```

Build (`npm run build`): `✓ built in 379ms` — sem erro de tipo.

Lint (`npm run lint`): sem erro nos arquivos desta fase (os 2 warnings
existentes são de `AuthContext.tsx`, pré-existentes, fora de escopo).

## Passo a passo de validação humana

1. `docker compose up -d` no `backend/` e `npm run dev` no `web/`.
2. Abrir `/jogadores` — confirmar coluna "Chance de pontuar" com
   `Baixa`/`Média`/`Alta` ou `—` (técnico / poucos jogos).
3. Clicar em "Casa" no grupo de filtro de mando — confirmar que só
   restam atletas de clubes mandantes na rodada atual, e que o botão
   fica com `aria-pressed="true"`.
4. Clicar em "Todos" — confirmar que a lista volta ao estado sem filtro.
5. Digitar o nome de um clube (não de um atleta) no campo de busca —
   confirmar que atletas daquele clube aparecem (RF07 do backend,
   transparente pro cliente web).
