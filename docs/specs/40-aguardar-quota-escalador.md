# Spec: Aguardar Quota do Escalador e Recalcular Automaticamente

## Contexto de Negócio

O Escalador continuará sem login, mas atingirá uma quota de 6 cálculos em 60 segundos definida no backend (web#36, backend#64). Quando essa quota é atingida, a interface deve aguardar a liberação e executar a mesma solicitação automaticamente, sem mostrar erro técnico ou exigir novo clique do visitante.

## Requisitos Funcionais

- **RF01:** Reconhecer somente HTTP 429 com `code=optimization_quota_exceeded` e `Retry-After` válido como espera automática; expor esses dados no erro do cliente de API sem perder o tratamento atual de 401/403/422.

- **RF02:** Manter o Escalador em estado de carregamento com overlay na área do resultado e mensagem amigável ("Preparando sua escalação. Aguarde um instante…"), sem exibir "429", "cota" ou detalhes de infraestrutura ao usuário.

- **RF03:** Aguardar `Retry-After` segundos e reenviar **uma vez por resposta 429** a mesma combinação congelada de orçamento, esquema e modo. Se receber outro 429 de quota, aguardar o novo prazo e repetir enquanto a tela estiver aberta e o usuário não cancelar.

- **RF04:** Desabilitar novo envio e edição dos parâmetros durante a espera; oferecer botão "Cancelar" que interrompe temporizador/requisição e libera o formulário.

- **RF05:** Ao sair da tela ou desmontar o componente, cancelar temporizador e requisição; nunca publicar resultado de tentativa antiga depois de uma nova.

- **RF06:** Após sucesso, renderizar a escalação normalmente, incluindo detalhes dos atletas; outros erros (422, 500, etc.) seguem o fluxo de erro existente.

## Requisitos Não-Funcionais

- **RNF01:** Estado de espera acessível com `role=status`/anúncio discreto; respeitar preferência por movimento reduzido.

- **RNF02:** Não usar polling curto nem disparar requisições antes do prazo informado pelo backend.

- **RNF03:** A espera não deve travar navegação nem criar repetição em segundo plano após cancelamento.

- **RNF04:** 429 sem código/prazo válido (por exemplo, do firewall) não entra no ciclo de repetição; mostrar mensagem amigável de indisponibilidade temporária.

## Critérios de Aceite

- **CA01:** 429 de quota com `Retry-After=8` mantém loading e não repete antes de 8 segundos; depois repete a mesma entrada e mostra resultado sem novo clique.

- **CA02:** Dois 429 consecutivos respeitam cada novo prazo; não há duas requisições simultâneas.

- **CA03:** Cancelar ou sair da tela impede o retry e qualquer atualização tardia.

- **CA04:** Erro 422, 500 ou 429 de outra origem é tratado sem retry automático.

- **CA05:** Nenhum texto técnico de quota/HTTP aparece na espera normal.

## Definition of Done

- [x] Código implementado e compilando
- [x] Testes de componente com relógio controlado cobrem sucesso após espera, 429 repetido, cancelamento, unmount e erros não elegíveis
- [x] Testes e build do web passam
- [x] Lint sem erros
- [x] Pre-commit hooks passando
- [x] Evidências capturadas
- [x] Passo a passo de validação humana escrito
- [x] PR aberta com link no Linear
- [x] Issue movida para In Review no Linear

## Fora de Escopo

- Alterar a quota
- Exigir login
- Repetir outros erros (422, 500, etc.)
- Criar notificações globais
- Implementar polling

## Dependências

- Depende do contrato 429 da backend#64 (deve incluir `code` e `Retry-After` no response body e header)
- Depende do proxy web#36 preservar `Retry-After` e corpo da resposta
- Frontend web#18 é o issue raiz que esta tarefa implementa
