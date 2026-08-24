# Evidências — Fase 7 (web): Média Básica

Data: 2026-08-24

## Resumo da Feature

Nova coluna "Média básica" na lista de jogadores, consumindo o campo
`media_basica` da Fase 7 backend (`GET /atletas`).

## Arquivos Modificados

```text
src/api/atletas.ts            (+1 campo no tipo Atleta)
src/pages/Jogadores.tsx        (+1 coluna: header + célula)
src/pages/Jogadores.test.tsx   (+1 teste)
src/pages/DetalheJogador.test.tsx (fixture atualizada)
src/theme.css                  (.num.base — cor neutra)
```

## Testes, cobertura, build e lint

Suíte completa (`npm test`): `106 testes passando (23 arquivos)`.

Cobertura (`npm run coverage`):

```text
All files       |  95.78 |    92.62 |   95.96 |   97.31
```

Build (`npm run build`): sem erro de tipo — pegou 8 fixtures em
`DetalheJogador.test.tsx` que precisavam do campo novo (only
detectado pelo `tsc`, não pelo `vitest`, que não type-checka por
padrão).

Lint: sem erro nos arquivos desta fase.

## Validação com a stack real

Confirmado no navegador com `docker compose up -d --build api`
(container recompilado com o campo novo) + `npm run dev`: coluna
"Média básica" aparece entre "Média geral" e "Média casa", em cinza,
com valores reais vindos do backend (ex.: Hulk 5,06 → 2,63).

## Passo a passo de validação humana

1. `docker compose up -d --build api` no `backend/` (recompila a
   imagem) + `npm run dev` no `web/`.
2. Abrir `/jogadores` — confirmar a coluna "Média básica" entre "Média
   geral" e "Média casa", em cinza.
3. Comparar com um artilheiro (ex.: atacante com gols na temporada) —
   a média básica deve ser visivelmente menor que a média geral.
4. Comparar com um jogador sem gol/assistência no período — os dois
   valores devem ser iguais.
