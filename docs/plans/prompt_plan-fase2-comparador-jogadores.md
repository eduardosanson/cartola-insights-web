# Prompt Plan: Fase 2 (Novo Ciclo) — Comparador de Dois Jogadores (web)

**Spec:** `docs/specs/spec-fase2-comparador-jogadores.md`

## Ordem de Implementação

### Bloco A — `AtletaAutocomplete.tsx` (independente, sem dependência dos outros blocos)

1. [ ] Teste (RED): `AtletaAutocomplete` renderiza um `input type="search"`
   e, ao digitar um nome (debounced, mesmo padrão de `Jogadores.tsx`),
   filtra a lista vinda de `listarTodosAtletas()` (mockada no teste) e
   mostra as opções.
2. [ ] Teste (RED): selecionar uma opção chama `onSelecionar(atleta)` com
   o `Atleta` completo (tipo de `src/api/atletas.ts`) e fecha a lista.
3. [ ] Teste (RED): quando a prop `posicaoPrioritaria` (opcional,
   `Posicao`) é passada, atletas dessa posição aparecem primeiro na
   lista, mas atletas de outras posições continuam aparecendo depois
   (não são removidos — RF04 permite comparar posições diferentes).
4. [ ] Implementação: `src/components/AtletaAutocomplete.tsx` — busca
   local sobre `listarTodosAtletas()` (mesmo cache-on-mount de
   `Jogadores.tsx`), filtro por nome (`includes`, case-insensitive),
   ordenação por `posicaoPrioritaria` quando presente.
5. [ ] Rodar os 3 testes acima e confirmar GREEN.
6. [ ] Commit: `feat: adiciona AtletaAutocomplete para seleção de atletas`.

### Bloco B — `PentagonoDual.tsx` (depende de `PentagonoQualidade.tsx`, já em `main`)

7. [ ] Teste (RED): dado `percentisA` e `percentisB` (dois
   `PercentisAtleta` da mesma posição), `PentagonoDual` renderiza dois
   `<polygon>` de jogador (um por atleta) mais os 4 anéis de referência
   e o polígono da mediana — mesma contagem de elementos estáticos de
   `PentagonoQualidade`, x2 para os polígonos de jogador.
8. [ ] Teste (RED): os dois polígonos de jogador usam classes/cores
   distintas (`--accent-home` para A, `--accent-away` para B) —
   asserção via `className` ou atributo `data-atleta="a"`/`"b"` no
   elemento.
9. [ ] Teste (RED): dado `percentisA` de um GOL e `percentisB` de um
   jogador de linha (posições incompatíveis), `PentagonoDual` não
   renderiza — retorna `null` (o caller, `Comparar.tsx`, decide o que
   mostrar no lugar; ver Bloco D).
10. [ ] Implementação: `src/components/PentagonoDual.tsx` — reaproveita
    `calcularPonto`, `POSICOES_ROTULOS` e as constantes de anéis de
    `PentagonoQualidade.tsx` (extrair as que forem compartilhadas para
    evitar duplicação, se a extração não quebrar os testes existentes
    da Fase 1; senão, duplicar as constantes geométricas — geometria
    fixa, sem lógica de negócio). Props: `{ percentisA: PercentisAtleta,
    percentisB: PercentisAtleta, nomeA: string, nomeB: string }`. Usa
    `ehPercentisGol` pra decidir compatibilidade (`ehPercentisGol(a) ===
    ehPercentisGol(b)`) antes de desenhar; retorna `null` se
    incompatível. O `<svg>` usa a mesma classe/estilo `max-width:
    100%; height: auto` já aplicada no wrapper de `PentagonoQualidade`
    (RNF02) — não criar um novo padrão de dimensionamento.
11. [ ] Rodar os testes do Bloco B e confirmar GREEN.
12. [ ] Commit: `feat: adiciona PentagonoDual para comparação de dois atletas`.

### Bloco C — `Comparar.tsx`: orquestração de dados (depende de A e B)

13. [ ] Teste (RED): ao montar com `?a=123&b=456` na URL, `Comparar`
    chama `buscarAtleta`, `buscarPercentisAtleta`,
    `buscarRaioXConfronto` e `buscarPerfilRiscoAtleta` para os IDs 123 e
    456 (8 chamadas, mockadas), via `Promise.allSettled`.
14. [ ] Teste (RED): se a chamada de `buscarPercentisAtleta(456)`
    rejeita (atleta sem dados suficientes) mas as demais resolvem, a
    tela mostra o Atleta A completo e, no lugar do pentágono do Atleta
    B, o texto "Dados insuficientes" — sem lançar erro nem travar o
    Atleta A (RNF04/CA05).
15. [ ] Teste (RED): sem `?a=` e `?b=` na URL, a tela mostra os dois
    `AtletaAutocomplete` vazios (estado inicial de seleção) em vez de
    tentar buscar.
16. [ ] Implementação: `src/pages/Comparar.tsx` — lê `useSearchParams`,
    dispara as 8 chamadas com `Promise.allSettled` quando `a` e `b`
    estão presentes, guarda estado por atleta como
    `'carregando' | 'ok' | 'erro-parcial'` (RNF04), renderiza os dois
    `AtletaAutocomplete` quando os IDs não estão setados.
17. [ ] Rodar os testes do Bloco C e confirmar GREEN.
18. [ ] Commit: `feat: adiciona página Comparar com busca paralela de dois atletas`.

### Bloco D — Blocos analíticos: Pentágono Dual, Head-to-Head, Raio-X, Perfil de Risco (depende de A, B, C)

19. [ ] Teste (RED): `Comparar` renderiza `PentagonoDual` quando ambos
    os atletas carregaram com sucesso e são da mesma categoria
    (padrão/GOL); renderiza os dois pentágonos individuais
    (`PentagonoQualidade`) lado a lado com um aviso de "posições não
    comparáveis" quando `PentagonoDual` retorna `null` (CA03).
20. [ ] Teste (RED): tabela Head-to-Head marca com badge o atleta com
    maior valor em cada métrica (`brutos.*` de cada `PercentisAtleta`) —
    pelo menos as métricas já existentes nos `brutos` retornados pela
    API (não inventar métricas novas).
21. [ ] Teste (RED): bloco Raio-X mostra `RaioXConfronto` (mando,
    adversário, `Veredito`) dos dois atletas lado a lado.
22. [ ] Teste (RED): bloco Perfil de Risco mostra `ClassificacaoRisco`
    e a distribuição retorno-direto/participação dos dois atletas lado
    a lado.
23. [ ] Implementação: monta os 4 blocos em `Comparar.tsx` (ou extrai
    sub-componentes se o arquivo passar de ~200 linhas — decisão de
    tamanho, não de responsabilidade nova). Layout em grid de 2
    colunas (Atleta A | Atleta B) que empilha em coluna única abaixo do
    breakpoint mobile já usado no resto do app — mesma media query de
    `Jogadores.tsx`, não um breakpoint novo (RNF03).
24. [ ] Rodar os testes do Bloco D e confirmar GREEN.
25. [ ] Commit: `feat: adiciona blocos de comparação (pentágono, head-to-head, raio-x, perfil de risco)`.

### Bloco E — Navegação, inversão, integração e DOD

26. [ ] Teste (RED): link "Comparar" aparece em `Nav.tsx` e aponta pra
    `/comparar`.
27. [ ] Implementação: adiciona a rota em `Nav.tsx`/roteador da app
    (mesmo padrão das rotas existentes).
28. [ ] Teste (RED): botão "Inverter Atletas" troca os IDs `a`/`b` na
    URL (via `setSearchParams`) sem refazer as 8 chamadas de rede caso
    os dados dos dois atletas já estejam em memória (cache local de
    estado, não `listarTodosAtletas`) — trocar só a ordem de exibição.
29. [ ] Implementação: botão de inversão em `Comparar.tsx`.
30. [ ] Teste (RED): a partir de `/jogadores` e de `/atletas/:id`, existe
    um atalho (botão/link) que leva para `/comparar?a={id}` com o
    segundo campo vazio para o usuário completar.
31. [ ] Implementação: atalho em `Jogadores.tsx` e `DetalheJogador.tsx`.
32. [ ] Rodar a suíte completa do projeto e confirmar cobertura ≥ 90%
    (RNF01).
33. [ ] Evidências (`docs/evidence/fase2-comparador-jogadores.md`) e
    checklist de DOD do spec.
34. [ ] Commit final: `docs: evidências e DOD da Fase 2 (comparador de jogadores)`.

## Dependências

- Depende de `PentagonoQualidade.tsx`, `percentis.ts`, `raioX.ts` e
  `perfilRisco.ts` já mergeados em `main` (Fase 1 — já entregue).
- Nenhuma dependência de backend nova (ver Decisão de Arquitetura no
  spec) — Fase 2 não bloqueia nem é bloqueada pelo backend.

## Riscos Identificados

- Risco: extrair constantes geométricas de `PentagonoQualidade.tsx`
  pra reaproveitar em `PentagonoDual.tsx` pode quebrar os testes já
  verdes da Fase 1 — mitigar rodando a suíte da Fase 1 inteira depois
  de qualquer extração (Passo 10), antes de seguir.
- Risco: `Promise.allSettled` com 8 chamadas pode gerar cascata de
  loading states difícil de testar — mitigar reduzindo pra uma máquina
  de estado por atleta (`carregando | ok | erro-parcial`, RNF04) em vez
  de 4 estados independentes por atleta.
