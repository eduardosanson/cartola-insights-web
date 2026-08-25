# Log de Decisões — Fase 3 (Novo Ciclo, web): Gestão de Patrimônio & MPV

## DOR → SPEC — 2026-08-25

- Decisão: simulador calcula `variacao_estimada = a·pontos + b` no
  cliente usando os coeficientes já devolvidos por `GET
  /atletas/{id}/mpv` — evita uma chamada de rede por movimento do
  slider (RNF02); o backend nunca recalcula a reta em tempo real, só
  entrega os coeficientes já materializados.
- Decisão: todo MPV exibido carrega o selo "estimativa baseada em
  dados históricos" de forma permanente (não em tooltip) — decisão de
  produto pra nunca deixar o usuário confundir com número oficial do
  Cartola (que não existe publicamente).
- Decisão: simulador avulso reaproveita `AtletaAutocomplete.tsx` da
  Fase 2 em vez de duplicar busca de atleta.

## SPEC → PROMPT PLAN — 2026-08-25

- Decisão: gráfico da curva de transição é SVG artesanal (mesmo
  princípio de `PentagonoQualidade`/`PentagonoDual`), sem lib de
  charting nova — consistente com o resto do produto, que não usa
  nenhuma lib de gráficos até agora.
- Decisão: Blocos A-D deste plano não bloqueiam em esperar o backend
  da Fase 3 mergeado — usam mocks fiéis ao contrato do spec backend;
  só o Bloco E (integração final) e a validação manual dependem do
  merge real.
