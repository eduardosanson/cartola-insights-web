# Spec: Indicar Rodada e Horário da Última Sincronização

## Contexto de Negócio

A tela de análises não informa quando o banco de dados foi atualizado. Após a API externa falhar, o usuário pode interpretar dados antigos como atuais. Este recurso resolve essa ambiguidade exibindo a rodada e timestamp da última sincronização bem-sucedida.

Depende de: https://github.com/eduardosanson/cartola-insights-backend/issues/61 (que fornece `/dados/status` com `last_successful_sync` e `last_sync_round`).

## Requisitos Funcionais

- **RF01**: Exibir rodada e data/hora da última sincronização bem-sucedida em local consistente nas telas de jogadores e escalador
- **RF02**: Se não houver dado, mostrar "Dados ainda não sincronizados"
- **RF03**: Se a consulta de status falhar (erro de rede), mostrar "Atualização indisponível" sem esconder as análises já carregadas
- **RF04**: Permitir ler o horário completo e o fuso na interface, com texto acessível (tooltip ou texto expandido exibe UTC original)

## Requisitos Não-Funcionais

- **RNF01**: Não inferir "atrasado" por limite de tempo arbitrário — exibir apenas fatos retornados pela API
- **RNF02**: A falha da consulta de status não pode bloquear os fluxos de jogadores ou otimização (fallback suave)
- **RNF03**: Resposta com rodada e timestamp produz texto consistente nas duas telas
- **RNF04**: Formatação respeita o fuso do usuário; valor UTC original continua identificável

## Critérios de Aceite

- [ ] Resposta com `round` e `timestamp` produz formatação idêntica em ambas as telas (Jogadores, Escalador)
- [ ] Resposta vazia (`null` ou `empty`) gera mensagem "Dados ainda não sincronizados"
- [ ] Erro de rede gera mensagem "Atualização indisponível" sem ocultar dados principais
- [ ] Formatação de timestamp respeita timezone do usuário; valor UTC original é legível em tooltip ou expandido
- [ ] Testes comprovam que falha no status não oculta os dados principais
- [ ] Componente é reutilizável e testável isoladamente

## Definition of Done

- [ ] Teste de cliente escrito primeiro (sincronizacao.test.ts) e verde
- [ ] Teste de componente escrito (IndicadorSincronizacao.test.tsx) e verde
- [ ] Componente implementado com 3 estados: sucesso, vazio, erro
- [ ] Integração em Jogadores.tsx — testes passam
- [ ] Integração em Escalador.tsx — testes passam
- [ ] Lint sem erros, build bem-sucedido, coverage ≥ 90%
- [ ] PR inclui capturas de tela dos 3 estados
- [ ] PR vinculado a #39 e ao backend issue #61
- [ ] Branch: `eduardosanson/39-indicar-rodada-e` (mantém branch atual)

## Fora de Escopo

- Alertas push, atualização automática periódica
- Classificação de frescor ("rodada desatualizada", "dados antigos")
- Sincronização manual / retry da API

## Arquivos Impactados

- Novo: `src/api/sincronizacao.ts` — cliente para `/dados/status`
- Novo: `src/components/IndicadorSincronizacao.tsx` — componente reutilizável
- Novo: testes correspondentes (`.test.ts` / `.test.tsx`)
- Modif: `src/pages/Jogadores.tsx` — adicionar componente ao layout
- Modif: `src/pages/Escalador.tsx` — adicionar componente ao layout
