# Mando da Rodada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expor no resumo de atleta e mostrar na interface se o clube joga em casa, fora ou nao possui partida na maior rodada sincronizada.

**Architecture:** O backend calcula a maior rodada e cria um mapa SQL de clube para mando, reutilizado pela query-base da listagem e detalhe. O frontend apenas tipa e apresenta o contrato, sem cruzar partidas nem chamar endpoints adicionais.

**Tech Stack:** FastAPI, SQLAlchemy 2, Pytest, React 19, TypeScript 6, Vitest e React Testing Library.

---

### Task 1: Contrato e query do backend

**Files:**
- Modify: `../backend/app/contexts/estatisticas/application/listar_atletas.py`
- Modify: `../backend/tests/unit/contexts/estatisticas/application/test_listar_atletas.py`
- Modify: `../backend/tests/unit/contexts/estatisticas/application/test_buscar_atleta_por_id.py`

- [ ] **Step 1: Escrever testes RED para casa, fora e sem jogo**

Persistir duas partidas em rodadas diferentes e atletas de clube mandante,
visitante e ausente da maior rodada. Exigir `rodada_atual == 24` e os tres
valores de `mando_rodada`. Criar ainda um teste sem partidas exigindo rodada
nula e `sem_jogo`.

- [ ] **Step 2: Verificar RED**

Run: `uv run pytest tests/unit/contexts/estatisticas/application/test_listar_atletas.py tests/unit/contexts/estatisticas/application/test_buscar_atleta_por_id.py -q`
Expected: FAIL porque `AtletaResumo` nao possui os novos campos.

- [ ] **Step 3: Implementar query e mapeamento**

Adicionar `rodada_atual: int | None` e `mando_rodada: str` ao dataclass. Criar
uma scalar subquery de `max(Partida.rodada)`, unir mandantes como `casa` e
visitantes como `fora`, fazer outer join por clube e usar `coalesce` para
`sem_jogo`.

- [ ] **Step 4: Verificar GREEN**

Run: `uv run pytest tests/unit/contexts/estatisticas/application/test_listar_atletas.py tests/unit/contexts/estatisticas/application/test_buscar_atleta_por_id.py -q`
Expected: PASS.

### Task 2: Schema HTTP do backend

**Files:**
- Modify: `../backend/app/contexts/estatisticas/api/atletas.py`
- Modify: `../backend/tests/integration/contexts/estatisticas/test_atletas_api.py`
- Modify: `../backend/tests/integration/contexts/estatisticas/test_atleta_por_id_api.py`

- [ ] **Step 1: Escrever testes RED do JSON**

Exigir `rodada_atual` e `mando_rodada` nas respostas da listagem e do detalhe,
incluindo atleta de clube sem partida.

- [ ] **Step 2: Verificar RED**

Run: `uv run pytest tests/integration/contexts/estatisticas/test_atletas_api.py tests/integration/contexts/estatisticas/test_atleta_por_id_api.py -q`
Expected: FAIL porque o schema Pydantic nao expoe os campos.

- [ ] **Step 3: Estender `AtletaResumoResponse`**

Adicionar `rodada_atual: int | None` e `mando_rodada: str`; manter listagem e
detalhe convertendo o mesmo `AtletaResumo`.

- [ ] **Step 4: Validar backend completo**

Run: `.venv/bin/ruff check app tests && .venv/bin/pytest tests -q --cov=app --cov-branch --cov-fail-under=90`
Expected: lint limpo, todos os testes aplicaveis passando e cobertura >=90%.

### Task 3: Contrato TypeScript e lista de jogadores

**Files:**
- Modify: `src/api/atletas.ts`
- Modify: `src/pages/Jogadores.tsx`
- Modify: `src/pages/Jogadores.test.tsx`

- [ ] **Step 1: Escrever teste RED da coluna Mando**

Adicionar fixtures casa, fora e sem jogo e exigir os tres textos na tabela,
com cores de casa e fora aplicadas.

- [ ] **Step 2: Verificar RED**

Run: `npm test -- src/pages/Jogadores.test.tsx`
Expected: FAIL porque a coluna Mando nao existe.

- [ ] **Step 3: Implementar tipo e coluna**

Adicionar `rodada_atual: number | null` e `mando_rodada` ao tipo `Atleta`.
Renderizar Casa, Fora ou Sem jogo com `var(--accent-home)`,
`var(--accent-away)` ou cor neutra.

- [ ] **Step 4: Verificar GREEN**

Run: `npm test -- src/pages/Jogadores.test.tsx`
Expected: PASS.

### Task 4: Detalhe, evidencias e validacao real

**Files:**
- Modify: `src/pages/DetalheJogador.tsx`
- Modify: `src/pages/DetalheJogador.test.tsx`
- Modify: `docs/evidence/mvp-web.md`
- Modify: `docs/decisions/mvp-web.md`
- Modify: `../backend/docs/evidence/fase2-consulta.md`

- [ ] **Step 1: Escrever teste RED do detalhe**

Exigir `Rodada 24 · Casa`, `Rodada 24 · Fora` e `Sem jogo na rodada 24` de
acordo com o resumo retornado.

- [ ] **Step 2: Verificar RED**

Run: `npm test -- src/pages/DetalheJogador.test.tsx`
Expected: FAIL porque o resumo da rodada nao e renderizado.

- [ ] **Step 3: Implementar e validar frontend**

Renderizar o resumo do mando no cabecalho do detalhe e executar
`npm run lint && npm run coverage && npm run build`.

- [ ] **Step 4: Validar dados reais**

Rebuildar a API Docker, consultar `/atletas` e `/atletas/{id}`, confirmar os
novos campos contra partidas reais e verificar que o Vite entrega a interface
atualizada.

### Restricao de integracao

Nao criar commit, push ou PR sem autorizacao explicita do usuario. Atualizar o
`ai-memory` somente ao finalizar a validacao completa.
