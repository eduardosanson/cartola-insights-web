# Log de Decisões — Fase 3b (Radar de Atributos, web)

## DOR → SPEC → PROMPT PLAN — 2026-08-23

- Decisão: radar de 4 eixos (não 6, como a POC) — decisão já tomada e
  justificada com dado real em `backend/docs/decisions/fase3a-percentis-posicao.md`;
  esta fase só desenha o que o backend manda.
- Decisão: rótulo do eixo resolvido por "qual chave existe na resposta"
  (`ehPercentisGol`), não por reconsultar a posição do atleta — a Fase 3a/3b
  backend já decidiu a posição uma vez; duplicar essa lógica no cliente
  criaria duas fontes de verdade pro mesmo fato.
- Risco aceito: erro de percentis (404) não usa `role="alert"` — é
  informativo ("este atleta não tem radar"), não uma falha de ação do
  usuário; se isso se provar confuso na validação humana, trocar é uma
  linha (CA03 do spec não especifica o `role`, só que a mensagem aparece).
