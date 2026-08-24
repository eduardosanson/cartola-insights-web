# Evidências — Fase 3d (web): Raio-X de Confronto

Data: 2026-08-23

## Resumo da Feature

`DetalheJogador` passa a consumir `GET /atletas/{id}/raio-x` (Fase 3d
backend, já em `main`) e mostra os três blocos do raio-X — média do atleta
no mando do próximo confronto, o que o adversário costuma ceder pra aquela
posição/mando, e a participação do atleta na pontuação do próprio time —
mais o selo de veredito (referência do time / contribuição dividida /
pontuação diluída).

## Arquivos Criados e Modificados

### Novos (4)

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/api/raioX.ts` | Cliente do endpoint: tipos `RaioXConfronto`/`Veredito`, `buscarRaioXConfronto` |
| `src/api/raioX.test.ts` | 2 testes: chamada GET e propagação do erro (incluindo 404) com a mensagem do backend |
| `src/components/RaioXConfronto.tsx` | Os 3 blocos + selo de veredito; cada bloco mostra "sem dado suficiente" independentemente, sem esconder os outros |
| `src/components/RaioXConfronto.test.tsx` | 4 testes: exibição completa, rótulo por mando, indisponibilidade parcial de dado, ausência de veredito |

### Modificados (2)

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DetalheJogador.tsx` | Novo par `useState`/`useEffect` para buscar o raio-x — mesmo padrão já estabelecido pelo radar (Fase 3b); seção e erro renderizados sem bloquear o resto da página |
| `src/pages/DetalheJogador.test.tsx` | Mock global de `buscarRaioXConfronto` no `beforeEach` (mesmo padrão do mock de percentis) + 2 testes novos: raio-x carregado com sucesso e mensagem de erro no lugar da seção quando o endpoint dá 404 |

## Ruling — teste do plano vs. comportamento real de `formatNumber`

O prompt plan especificava o teste esperando `'12,40%'` pra
`participacao_pontuacao_time_media: 12.4`, mas o spec (RF03) manda reusar
`formatNumber` — que usa `Intl.NumberFormat('pt-BR', {
maximumFractionDigits: 2 })` sem `minimumFractionDigits`, então
`formatNumber(12.4)` produz `'12,4'`, não `'12,40'` (confirmado contra
`src/utils/formatNumber.test.ts`, que já cobre esse comportamento de
truncar zero à direita). Ajustado o teste pro comportamento real da função
já usada em toda a página — não o código, que está de acordo com o spec.

## Passo a passo de validação humana

1. `docker compose up -d` no `backend/` e `npm run dev` no `web/`.
2. Abrir `/jogadores`, clicar num atacante com jogo agendado na rodada
   corrente.
3. Confirmar que a seção "Raio-X do confronto" aparece com os três blocos
   preenchidos e um dos três rótulos de veredito ("Referência do time",
   "Contribuição dividida" ou "Pontuação diluída").
4. Abrir um técnico (ou um atleta cujo clube não tenha confronto
   sincronizado) — confirmar que aparece a mensagem de erro do backend no
   lugar da seção, sem quebrar o resto da página (histórico e radar
   continuam normais).

## Testes, cobertura, build e lint

Suíte completa (`npm test`):

```text
Test Files  20 passed (20)
     Tests  90 passed (90)
```

Cobertura (`npm run coverage`):

```text
All files          |   96.12 |    92.78 |   95.72 |   97.12
```

Build (`npm run build`): `✓ built in 275ms` — sem erro de tipo.

Lint (`npm run lint`): sem erro nos arquivos desta fase (os 2 warnings
existentes são de `AuthContext.tsx`, pré-existentes, fora de escopo).
