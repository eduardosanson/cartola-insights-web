# Evidências — Fase 3e (web): Perfil de Risco

Data: 2026-08-23

## Resumo da Feature

`DetalheJogador` passa a consumir `GET /atletas/{id}/perfil-risco` (Fase 3e
backend, já em `main`) e mostra um selo de risco (baixo/médio/alto) no
cabeçalho do jogador, ao lado do mando da rodada — mesmo padrão de
"dicionário por chave discreta" já usado em `MandoRodada.tsx`: o cliente só
traduz `classificacao` → rótulo/cor, os limiares já foram resolvidos pelo
backend (RF02 do spec).

## Arquivos Criados e Modificados

### Novos (4)

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/api/perfilRisco.ts` | Cliente do endpoint: tipos `PerfilRisco`/`ClassificacaoRisco`, `buscarPerfilRiscoAtleta` |
| `src/api/perfilRisco.test.ts` | 2 testes: chamada GET e propagação do erro (incluindo 404) com a mensagem do backend |
| `src/components/SeloRisco.tsx` | Badge com rótulo + cor por `classificacao` (`--accent-home`/`--accent-away`/`--danger`) + percentual formatado |
| `src/components/SeloRisco.test.tsx` | 4 testes: as 3 classificações (cor + rótulo) e a formatação pt-BR do percentual |

### Modificados (2)

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DetalheJogador.tsx` | Novo par `useState`/`useEffect` para buscar o perfil de risco; selo renderizado dentro do `<header>`, ao lado do `MandoRodada`; erro é `<p>` informativo, não bloqueia a página |
| `src/pages/DetalheJogador.test.tsx` | Mock global de `buscarPerfilRiscoAtleta` no `beforeEach` (evita promise rejeitada não observada nos testes que não mockam esse endpoint, mesmo padrão dos mocks de percentis/raio-x) + 2 testes novos: selo carregado com sucesso e mensagem de erro no lugar do selo quando o endpoint dá 404 |

## Passo a passo de validação humana

1. `docker compose up -d` no `backend/` e `npm run dev` no `web/`.
2. Abrir `/jogadores`, clicar num atacante artilheiro (bastante gol na
   temporada) — confirmar que o selo mostra "Risco alto" em vermelho
   (`--danger`), ao lado do mando da rodada.
3. Abrir um lateral/zagueiro com pouco gol e bastante desarme — confirmar
   "Risco baixo" em verde (`--accent-home`).
4. Abrir um atleta com poucos jogos (ou um técnico) — confirmar que
   aparece a mensagem de erro do backend no lugar do selo, sem quebrar o
   resto da página.

## Testes, cobertura, build e lint

Suíte completa (`npm test`):

```text
Test Files  22 passed (22)
     Tests  98 passed (98)
```

Cobertura (`npm run coverage`):

```text
All files          |   95.95 |     92.5 |   95.86 |   97.22
```

Build (`npm run build`): `✓ built in 248ms` — sem erro de tipo.

Lint (`npm run lint`): sem erro nos arquivos desta fase (os 2 warnings
existentes são de `AuthContext.tsx`, pré-existentes, fora de escopo).
