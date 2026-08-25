# Prompt Plan: Fase 3 (Novo Ciclo) — Gestão de Patrimônio & MPV (web)

**Spec:** `docs/specs/spec-fase3-gestao-patrimonio-mpv.md`

## Ordem de Implementação

### Bloco A — Cliente de API (`src/api/mpv.ts`, novo)

1. [ ] Teste (RED): `buscarMpvAtleta(id)` faz `GET /atletas/{id}/mpv` e
   retorna o objeto tipado (`mpv_estimado: number | null,
   faixa_preco: {min, max}, coeficientes: {a, b}, amostras: number,
   confiavel: boolean`).
2. [ ] Teste (RED): `buscarCurvaValorizacao(rodadaAte?)` faz `GET
   /mercado/curva-valorizacao` (com `?rodada_ate=` quando informado) e
   retorna `{rodada: number, variacao_media: number}[]`.
3. [ ] Implementação: `src/api/mpv.ts` — segue o mesmo padrão de
   `src/api/percentis.ts` (usa o `client.ts` compartilhado).
4. [ ] Commit: `feat: adiciona cliente de API para MPV e curva de valorização`.

### Bloco B — Selo de MPV em `DetalheJogador.tsx` (depende de A)

5. [ ] Teste (RED): dado `confiavel: true`, o bloco de patrimônio
   mostra `mpv_estimado` com o texto "estimativa baseada em dados
   históricos" sempre visível (não só em tooltip/hover).
6. [ ] Teste (RED): dado `confiavel: false` ou `mpv_estimado: null`, a
   UI mostra "dados insuficientes ainda para estimar" — sem `null`,
   `NaN` ou bloco vazio.
7. [ ] Implementação: bloco novo em `DetalheJogador.tsx`, consumindo
   `buscarMpvAtleta`.
8. [ ] Rodar os testes do Bloco B e confirmar GREEN.
9. [ ] Commit: `feat: exibe MPV estimado no detalhe do jogador`.

### Bloco C — `SimuladorValorizacao.tsx` (depende de A)

10. [ ] Teste (RED): dado `coeficientes: {a: 0.5, b: -1.0}`, mover o
    slider pra `pontos=4` calcula `variacao_estimada = 1.0` no
    cliente, sem nenhuma chamada de rede adicional (mock de
    `buscarMpvAtleta` chamado uma única vez, na montagem).
11. [ ] Teste (RED): o resultado é formatado como C$ usando a mesma
    função de formatação de moeda já usada pra `preco_num` no resto do
    app (localizar e reutilizar, não duplicar formatação).
12. [ ] Implementação: `src/components/SimuladorValorizacao.tsx` —
    props `{ atletaId: number }`, busca `coeficientes` uma vez no mount
    via `buscarMpvAtleta`, `<input type="range">` de 0 a 20,
    recalcula localmente a cada `onChange`.
13. [ ] Rodar os testes do Bloco C e confirmar GREEN.
14. [ ] Commit: `feat: adiciona SimuladorValorizacao com slider client-side`.

### Bloco D — Curva de Transição Estratégica (depende de A)

15. [ ] Teste (RED): dado pontos de `buscarCurvaValorizacao` para as
    rodadas 1 a 8, o gráfico renderiza uma faixa/região visualmente
    destacada cobrindo especificamente as rodadas 1 a 5 (CA04 —
    asserção via classe/atributo do elemento de destaque, não só
    "renderiza algo").
16. [ ] Implementação: componente de gráfico (SVG simples, mesmo
    princípio de `PentagonoQualidade`/`PentagonoDual` — sem lib de
    charting nova, YAGNI) com a faixa de destaque das rodadas 1-5 e
    nota textual explicando o porquê.
17. [ ] Implementação: aplica a mesma classe/estilo `max-width: 100%;
    height: auto` já usada nos outros SVGs do produto (RNF03).
18. [ ] Rodar os testes do Bloco D e confirmar GREEN.
19. [ ] Commit: `feat: adiciona gráfico de curva de transição estratégica`.

### Bloco E — `Patrimonio.tsx` (depende de A, B, C, D e de `AtletaAutocomplete` da Fase 2)

20. [ ] Teste (RED): rota `/patrimonio` renderiza a curva de transição
    e um `AtletaAutocomplete` (Fase 2) pro simulador avulso — nenhum
    componente de busca duplicado (CA05).
21. [ ] Teste (RED): selecionar um atleta no autocomplete monta
    `SimuladorValorizacao` pra aquele atleta.
22. [ ] Implementação: `src/pages/Patrimonio.tsx` — reaproveita
    `AtletaAutocomplete.tsx` (`web/docs/plans/prompt_plan-fase2-comparador-jogadores.md`,
    já em `main` nesse ponto) sem props novas além das já existentes.
23. [ ] Teste (RED): link "Patrimônio" aparece em `Nav.tsx` e aponta
    pra `/patrimonio`.
24. [ ] Implementação: adiciona a rota em `Nav.tsx`/roteador (mesmo
    padrão das rotas existentes).
25. [ ] Rodar a suíte completa do projeto e confirmar cobertura ≥ 90%
    (RNF01).
26. [ ] Evidências (`docs/evidence/fase3-gestao-patrimonio-mpv.md`) e
    checklist de DOD do spec.
27. [ ] Commit final: `docs: evidências e DOD da Fase 3 web (patrimônio e MPV)`.

## Dependências

- Depende de `backend/docs/plans/prompt_plan-fase3-gestao-patrimonio-mpv.md`
  estar em `main` (endpoints `GET /atletas/{id}/mpv` e `GET
  /mercado/curva-valorizacao`).
- Depende de `AtletaAutocomplete.tsx` da Fase 2
  (`web/docs/plans/prompt_plan-fase2-comparador-jogadores.md`) já em
  `main` — Bloco E é bloqueado até lá; Blocos A-D podem começar antes
  (só dependem do backend).

## Riscos Identificados

- Risco: sem o backend da Fase 3 em `main`, Blocos A-D não têm
  endpoint real pra testar contra — mitigar com mocks de contrato
  fiel ao spec do backend (`mpv_estimado`, `coeficientes`,
  `curva-valorizacao`) nos testes, e um passo de integração manual
  (curl + tela) só depois que o backend for mergeado.
- Risco: gráfico SVG sem lib de charting pode ficar mais trabalhoso
  que usar uma lib pronta — aceito pelo mesmo motivo do resto do
  produto (zero dependência de charting até agora, consistência).
