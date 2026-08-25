# Spec: Fase 5 (Novo Ciclo) — Matriz de Capitão & Live Radar (web)

## Contexto de Negócio

Continuação de `backend/docs/specs/spec-fase5-matriz-capitao-live.md`
— o backend expõe a Matriz de Capitão (Top 5), o status ao vivo dos
atletas e a sugestão de substituto. Esta fase entrega a UI:
`MatrizCapitao.tsx` (ranking) e `AlertasMercado.tsx` (painel de status
pré-fechamento com sugestão de troca).

## Requisitos Funcionais

- RF01: Tela/seção `MatrizCapitao.tsx` — lista os Top 5 de `GET
  /otimizador/matriz-capitao` com `capitao_score`, o próximo confronto
  (reaproveita o componente de raio-X já existente) e um selo
  destacando o 1º colocado.
- RF02: `AlertasMercado.tsx` — ao montar (e ao voltar o foco pra aba,
  `visibilitychange`), busca `GET /mercado/status-alterados?desde=`
  usando o timestamp da última checagem (guardado em memória do
  componente, não `localStorage` — sem persistência entre sessões
  nesta fase). **Sem polling automático em background** (RNF03 do
  backend não tem scheduler; o cliente não inventa um) — só verifica
  quando a tela está com foco.
- RF03: Cada atleta com status alterado (Dúvida/Suspenso/Contundido)
  aparece como um card de alerta com o novo status e um botão "Ver
  substituto sugerido", que chama `GET
  /otimizador/substituto/{atleta_id}` sob demanda (não pré-carrega
  substituto pra todo mundo).
- RF04: Quando `GET /otimizador/substituto/{id}` retorna 404 (nenhum
  candidato elegível na faixa de preço), mostra "nenhum substituto
  direto encontrado nessa faixa de preço" — não esconde o card nem
  quebra a tela.
- RF05: `AlertasMercado.tsx` fica acessível a partir da navegação
  principal (`Nav.tsx`) e também embutido como widget compacto na
  home/dashboard, se existir (reaproveitar componente, não duplicar
  lógica de busca).

## Requisitos Não-Funcionais

- RNF01: Testes ≥ 90% de cobertura.
- RNF02: Nenhum `setInterval`/polling contínuo em background — só
  verificação ao montar/focar (RF02), pra não gerar carga
  desnecessária no backend nem drenar bateria em mobile.
- RNF03: Estados vazios claros: "nenhuma mudança de status desde a
  última checagem" quando `status-alterados` retorna lista vazia — não
  uma tela em branco.

## Critérios de Aceite

- CA01: A Matriz de Capitão mostra os 5 candidatos na ordem retornada
  pelo backend, sem reordenar no cliente.
- CA02: Voltar o foco pra aba (`visibilitychange`) dispara uma nova
  checagem de status alterado.
- CA03: Clicar em "Ver substituto sugerido" busca e mostra o substituto
  só depois do clique (RF03), não antes.
- CA04: 404 do endpoint de substituto mostra a mensagem de RF04.

## Definition of Done (DOD)

- [x] Código implementado e compilando
- [x] Testes escritos e passando, cobertura ≥ 90%
- [x] Lint sem erros
- [x] Evidências capturadas (`docs/evidence/fase5-matriz-capitao-live.md`)
- [x] Passo a passo de validação humana escrito
- [ ] Integrado em `main`

## Fora de Escopo

- Notificação push/e-mail — a UI só mostra alerta quando a tela está
  aberta (RF02); nenhum canal fora do app nesta fase.
- Persistir "última checagem" entre sessões/dispositivos —
  `localStorage` não é usado aqui, cada sessão de navegador começa do
  zero (`desde` = hora da montagem do componente).
