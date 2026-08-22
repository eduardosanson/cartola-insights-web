# Log de Decisoes — MVP Web

## DOR -> SPEC -- 2026-08-22

- Decisao: o MVP consome exclusivamente dados reais do backend local; mocks ficam restritos aos testes.
- Decisao: a primeira fatia inclui tabela de clubes, lista de jogadores e detalhe com historico.
- Risco aceito: radar, raio-X e perfil de risco ficam fora do MVP por dependerem de novos dados e endpoints.

## SPEC -> PROMPT PLAN -- 2026-08-22

- Decisao: React Router fornece URLs navegaveis para as tres telas, incluindo acesso direto ao detalhe.
- Decisao: o cliente HTTP fica isolado em `src/api` e recebe a URL base por `VITE_API_BASE_URL`.
- Risco aceito: a execucao local depende do backend em `localhost:8000` e do CORS para `localhost:5173`.

## PROMPT PLAN -> TDD -- 2026-08-22

- Decisao: Vitest e React Testing Library validam comportamento de usuario e estados de rede.
- Decisao: cobertura minima de 90% vale separadamente para statements, branches, functions e lines.
- Risco aceito: validacao visual automatizada nao integra esta fatia; a evidencia final sera capturada contra dados reais.

## TDD -> BUILD -- 2026-08-22

- Decisao: o detalhe sempre busca resumo e historico pela API, eliminando dependencia de `location.state`.
- Decisao: `TEC` integra o contrato de posições e aparece como sexto filtro da listagem.
- Risco aceito: as duas consultas do detalhe executam em paralelo e qualquer falha interrompe a tela inteira com mensagem explicita.

## BUILD -> EVIDENCIAS -- 2026-08-22

- Decisao: a evidencia usa o PostgreSQL persistente e a API Docker local, sem fixtures ou dados mockados.
- Decisao: o frontend permanece servido por Vite em loopback para permitir validacao imediata do MVP.
- Risco aceito: nao foi capturada screenshot automatica porque a interface desktop do Orca estava indisponivel nesta sessao.

## EVIDENCIAS -> SPEC -- 2026-08-22

- Decisao: criterios de ordenacao sao combinaveis e seguem a ordem dos cliques, indicada visualmente por prioridade.
- Decisao: numeros sao ordenados pelo valor bruto e formatados apenas na renderizacao, com no maximo duas casas decimais.
- Risco aceito: a ordenacao de jogadores cobre somente a pagina atual; ordenacao global exigiria alterar o contrato paginado do backend.

## SPEC -> PROMPT PLAN -- 2026-08-22

- Decisao: o incremento usa um hook generico, um cabecalho reutilizavel e um formatador central em vez de duplicar logica nas telas.
- Decisao: a prioridade visual e recalculada quando um criterio e removido.

## PROMPT PLAN -> TDD -- 2026-08-22

- Decisao: testes unitarios validam precisao bruta e ciclo de criterios; testes de tela validam a interacao completa.
- Risco aceito: `Intl.NumberFormat` usa locale `pt-BR`, portanto casas decimais aparecem com virgula.

## TDD -> BUILD -- 2026-08-22

- Decisao: os cabecalhos ativos mostram seta e prioridade sem substituir os valores originais recebidos da API.
- Decisao: o piso de 90% permanece aplicado separadamente a statements, branches, functions e lines.

## BUILD -> SPEC -- 2026-08-22

- Decisao: a tela recebe mando e rodada no resumo de atleta em vez de cruzar partidas no navegador.
- Decisao: casa usa verde, fora usa ocre e sem jogo usa apresentacao neutra.
- Risco aceito: adversario e horario permanecem fora deste incremento.

## SPEC -> PROMPT PLAN -- 2026-08-22

- Decisao: lista e detalhe consomem os mesmos campos `rodada_atual` e `mando_rodada` do resumo de atleta.
- Decisao: um componente compartilhado apresenta os tres estados e evita divergencia visual.

## PROMPT PLAN -> TDD -- 2026-08-22

- Decisao: testes de tela cobrem casa, fora e sem jogo; o backend cobre tambem ausencia total de partidas.
- Risco aceito: a tela mostra a maior rodada persistida, mesmo que a API externa ja tenha avancado antes do proximo sincronismo.

## TDD -> BUILD -- 2026-08-22

- Decisao: o frontend nao realiza chamada adicional para partidas; o contrato de atleta e suficiente.
- Decisao: a coluna Mando nao participa da ordenacao nem dos filtros neste incremento.
