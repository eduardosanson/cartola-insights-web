# Log de Decisões — Fase 1 (Novo Ciclo, web): Pentágono de Qualidade + Filtro de Mando

## DOR → SPEC → PROMPT PLAN — 2026-08-24

- Decisão: componente novo `PentagonoQualidade.tsx` em vez de editar
  `RadarAtributos.tsx` in-place — mantém o histórico de commit
  separando "generalização geométrica pra N eixos" de "recurso novo
  (anéis, sombra, tooltip, overall score)"; `RadarAtributos.tsx` é
  removido só depois de confirmado que nada mais o usa.
- Decisão: polígono da mediana desenhado como pentágono regular de
  raio 50% fixo (constante geométrica), não a partir dos valores
  brutos de `mediana_posicao` — cada eixo já é percentil (0-100), então
  a mediana é sempre 50% em todo eixo, por definição; os valores brutos
  de `mediana_posicao` servem só pro tooltip, não pra desenhar a forma.
- Decisão: filtro de mando (Bloco A do prompt plan) é independente do
  Pentágono e não depende do backend — pode ser implementado e
  shippado primeiro, sem bloquear em cima do trabalho de backend desta
  fase.
- Nota: mesma ressalva de numeração do backend — Fase 1 do *novo
  ciclo*, não a Fase 1 (Fundação) já concluída.
