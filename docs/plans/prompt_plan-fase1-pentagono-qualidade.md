# Prompt Plan: Fase 1 (Novo Ciclo) — Pentágono de Qualidade + Filtro de Mando (web)

## Ordem de Implementação

### Bloco A — Filtro de mando (independente, sem dependência de backend)

1. [ ] Teste (RED): grupo de filtro de mando não renderiza mais o botão
   "Todos".
2. [ ] Teste (RED): clicar em "Casa" já ativo remove o filtro (volta a
   listar todos os atletas — `listarAtletas` chamado com
   `mando: undefined`).
3. [ ] Implementação: `Jogadores.tsx` — remove a opção `''` do array de
   valores, adapta `onClick` pra alternar (`mando === valor ? '' :
   valor`).

### Bloco B — Pentágono (depende do backend Fase 1)

4. [ ] Atualizar `src/api/percentis.ts` — tipos novos
   (`media_basica`, `brutos`, `mediana_posicao`, `overall_score`) nos
   dois formatos (padrão/GOL).
5. [ ] Teste (RED): `PentagonoQualidade` renderiza 5 `<circle>` de
   vértice (não 4).
6. [ ] Implementação: generalizar `pontoEixo`/eixos de
   `RadarAtributos.tsx` pra 5 entradas — criar `PentagonoQualidade.tsx`
   novo (não editar o antigo in-place, pra manter histórico de commit
   claro entre "generalização" e "novo recurso").
7. [ ] Teste (RED): 4 anéis de referência (25/50/75/100%) presentes no
   SVG.
8. [ ] Implementação: desenhar os 4 anéis concêntricos (polígonos
   regulares de raio proporcional).
9. [ ] Teste (RED): polígono tracejado da mediana (raio 50% fixo,
   forma de pentágono regular).
10. [ ] Implementação: desenhar o polígono da mediana.
11. [ ] Teste (RED): Overall Score exibido no centro, igual ao valor
    de `overall_score` da API.
12. [ ] Implementação: número central.
13. [ ] Teste (RED): hover/foco num vértice mostra tooltip com rótulo +
    valor bruto + percentil.
14. [ ] Implementação: tooltip acessível (`role="tooltip"`,
    `aria-describedby`).
15. [ ] Integrar `PentagonoQualidade` em `DetalheJogador.tsx` no lugar
    de `RadarAtributos` — depois de tudo verde, remover
    `RadarAtributos.tsx`/teste se não for mais usado em nenhum lugar
    (checar antes de apagar).
16. [ ] Evidências e DOD.

## Dependências

- Bloco B depende de `backend/docs/plans/prompt_plan-fase1-pentagono-qualidade.md`
  estar em `main` (campos novos na API).
- Bloco A é independente — pode shippar primeiro, sem esperar o
  backend.

## Riscos Identificados

- Risco: remover `RadarAtributos.tsx` pode quebrar algo se outro lugar
  do app o importar além de `DetalheJogador.tsx` — checar com grep
  antes de apagar (`grep -rn RadarAtributos src/`).
- Risco: tooltip acessível em SVG tem suporte inconsistente entre
  leitores de tela — mitigar com `aria-label` no `<circle>` como
  fallback, não só o `role="tooltip"` posicionado.
