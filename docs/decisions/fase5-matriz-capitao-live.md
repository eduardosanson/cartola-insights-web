# Log de Decisões — Fase 5 (Novo Ciclo, web): Matriz de Capitão & Live Radar

## DOR → SPEC — 2026-08-25

- Decisão: sem polling automático em background — `AlertasMercado.tsx`
  só verifica status ao montar/focar a aba (`visibilitychange`),
  espelhando a decisão do backend de não ter scheduler in-process
  (RNF03 backend). Evita `setInterval` gerando carga sem necessidade.
- Decisão: substituto sugerido é buscado sob demanda (clique), não
  pré-carregado pra todo alerta — evita N chamadas desnecessárias
  quando o usuário só quer ver quais atletas mudaram de status.
- Decisão: sem `localStorage` pra "última checagem" — cada sessão
  começa do zero; simplicidade sobre persistência cross-device nesta
  fase.

## SPEC → PROMPT PLAN — 2026-08-25

- Decisão: `MatrizCapitao.tsx` reaproveita o componente de raio-X das
  Fases 3b/3d pro próximo confronto de cada candidato — sem duplicar
  a exibição de mando/adversário/veredito.

## TDD → ENTREGA — 2026-08-25

- Decisão: as duas experiências vivem em rotas públicas dedicadas,
  `/capitaes` e `/alertas`, porque o app atual não possui uma home/dashboard
  onde o widget compacto pudesse ser embutido sem inventar uma nova tela.
- Decisão: nomes de atletas são hidratados por `buscarAtleta`; falhas
  individuais preservam cards e links usando `Atleta #ID`, sem reordenar ou
  descartar o resultado analítico do backend.
- Decisão: `404` do substituto é um resultado válido no cliente (`null`),
  enquanto demais erros continuam propagados e visíveis na UI.
- Decisão: a checagem de status só avança o marcador após uma resposta bem
  sucedida e usa como novo valor o instante de início da request. Assim uma
  falha repete a mesma janela e uma alteração ocorrida durante a request entra
  na próxima consulta; apenas `visibilityState === 'visible'` dispara nova
  checagem.
- Evidência final após revisão integrada: 192 testes passaram; cobertura
  global de 97,94% statements, 90,75% branches, 99,23% functions e 99,23%
  lines; lint e build aprovados.
- Integração de contrato: backend do worktree retornou HTTP 200 com 5
  candidatos, 534 alterações desde epoch e um substituto real para o primeiro
  candidato. O container padrão em `:8000` estava desatualizado; a validação
  usou o source atual em `:8001`.

## Integração — 2026-08-25

- A branch `eduardosanson/Roadmap-2` foi integrada em `main` por fast-forward;
  o backend correspondente já estava publicado em `origin/main`.
