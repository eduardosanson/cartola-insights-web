# Ordenacao e Formatacao Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ordenacao numerica multipla nas tabelas de clubes e jogadores e limitar precos, medias e pontos a duas casas decimais na interface.

**Architecture:** Um hook generico controla criterios ordenados por prioridade e preserva os valores numericos brutos nas comparacoes. Um cabecalho reutilizavel apresenta direcao/prioridade, enquanto um formatador centralizado cuida somente da exibicao em portugues brasileiro.

**Tech Stack:** React 19, TypeScript 6, Vitest, React Testing Library e Vite.

---

### Task 1: Formatador numerico

**Files:**
- Create: `src/utils/formatNumber.ts`
- Create: `src/utils/formatNumber.test.ts`

- [ ] **Step 1: Escrever testes que falham**

Cobrir inteiros, uma casa, duas casas, arredondamento e numero negativo usando `formatNumber`.

- [ ] **Step 2: Verificar RED**

Run: `npm test -- src/utils/formatNumber.test.ts`
Expected: FAIL porque `formatNumber.ts` ainda nao existe.

- [ ] **Step 3: Implementar o minimo**

Criar um `Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })` compartilhado e exportar `formatNumber(value: number): string`.

- [ ] **Step 4: Verificar GREEN**

Run: `npm test -- src/utils/formatNumber.test.ts`
Expected: PASS.

### Task 2: Estado de ordenacao multipla

**Files:**
- Create: `src/hooks/useMultiSort.ts`
- Create: `src/hooks/useMultiSort.test.ts`

- [ ] **Step 1: Escrever testes que falham**

Usar `renderHook` para validar: novo criterio descendente; segundo clique ascendente; terceiro clique remove; segundo campo ganha prioridade 2; empates usam o criterio seguinte; ordenacao usa numeros brutos.

- [ ] **Step 2: Verificar RED**

Run: `npm test -- src/hooks/useMultiSort.test.ts`
Expected: FAIL porque o hook ainda nao existe.

- [ ] **Step 3: Implementar o minimo**

Exportar `SortCriterion<K>`, `SortDirection` e `useMultiSort(items, accessors)`. O hook retorna `sortedItems`, `criteria` e `toggleSort`; criterios ausentes entram como `desc`, depois mudam para `asc` e por fim sao removidos.

- [ ] **Step 4: Verificar GREEN**

Run: `npm test -- src/hooks/useMultiSort.test.ts`
Expected: PASS.

### Task 3: Cabecalho e integracao nas tabelas

**Files:**
- Create: `src/components/SortableHeader.tsx`
- Modify: `src/pages/Tabela.tsx`
- Modify: `src/pages/Tabela.test.tsx`
- Modify: `src/pages/Jogadores.tsx`
- Modify: `src/pages/Jogadores.test.tsx`

- [ ] **Step 1: Escrever testes que falham**

Na tabela de clubes, clicar em media casa e conferir descendente; clicar novamente e conferir ascendente; adicionar media fora e conferir prioridade; clicar pela terceira vez em casa e garantir que fora permanece. Repetir uma ordenacao combinada representativa em jogadores.

- [ ] **Step 2: Verificar RED**

Run: `npm test -- src/pages/Tabela.test.tsx src/pages/Jogadores.test.tsx`
Expected: FAIL porque os cabecalhos ainda nao sao botoes ordenaveis.

- [ ] **Step 3: Implementar o minimo**

Criar `SortableHeader` com botao, seta e prioridade. Integrar `useMultiSort` em `Tabela` para `media_pontos_casa`/`media_pontos_fora` e em `Jogadores` para `preco_atual`/`media_geral`/`media_casa`/`media_fora`.

- [ ] **Step 4: Verificar GREEN**

Run: `npm test -- src/pages/Tabela.test.tsx src/pages/Jogadores.test.tsx`
Expected: PASS.

### Task 4: Formatacao em todas as telas e fechamento

**Files:**
- Modify: `src/pages/Tabela.tsx`
- Modify: `src/pages/Jogadores.tsx`
- Modify: `src/pages/DetalheJogador.tsx`
- Modify: `src/pages/DetalheJogador.test.tsx`
- Modify: `docs/evidence/mvp-web.md`
- Modify: `docs/decisions/mvp-web.md`

- [ ] **Step 1: Escrever testes que falham**

Usar valores com tres ou mais casas nos testes das telas e exigir textos formatados com virgula e no maximo duas casas.

- [ ] **Step 2: Verificar RED**

Run: `npm test -- src/pages/Tabela.test.tsx src/pages/Jogadores.test.tsx src/pages/DetalheJogador.test.tsx`
Expected: FAIL porque as telas ainda renderizam numeros brutos.

- [ ] **Step 3: Implementar o minimo**

Aplicar `formatNumber` a precos, medias e pontos sem alterar os objetos usados por `useMultiSort`.

- [ ] **Step 4: Validar o projeto**

Run: `npm run lint && npm run coverage && npm run build`
Expected: lint limpo, 31 ou mais testes passando, todos os pisos de cobertura acima de 90% e build Vite aprovado.

- [ ] **Step 5: Validar dados reais**

Abrir as rotas servidas pelo Vite, confirmar API/HTML com `curl` e registrar em `docs/evidence/mvp-web.md` a ordenacao e formatacao observadas.

### Restricao de integracao

Nao criar commit, push ou PR sem autorizacao explicita do usuario.
