# Spec: Mostrar Overall Contextual e Rodada na Lista e Detalhe de Atletas

## Contexto de Negócio

O Overall Contextual do épico #9 do backend considera forma recente, confronto e disponibilidade. A UI atual mostra apenas `overall_score` (modelo legado) sem indicar a rodada ou qual modelo gerou o número. O usuário precisa saber se compara dados da próxima rodada ou se é o score legado.

## Requisitos Funcionais

- **RF01:** Mostrar o score contextual e `rodada_alvo` na lista de atletas quando a API os fornecer
- **RF02:** Mostrar o score contextual e `rodada_alvo` no detalhe de cada atleta
- **RF03:** Diferenciar visualmente score contextual de Overall legado
- **RF04:** Exibir legenda curta do significado de ambos os scores
- **RF05:** Quando sem score contextual, exibir estado "ainda não calculado"
- **RF06:** Preservar leitura do Overall legado até a migração completa

## Requisitos Não-Funcionais

- **RNF01:** Interface acessível por teclado e leitor de tela; não depender apenas de cor
- **RNF02:** Não calcular nem estimar score no frontend; usar contrato da API
- **RNF03:** Cobertura de testes ≥ 90%

## Critérios de Aceite

- **CA01:** Atleta com score contextual exibe valor e rodada coerentes em lista e detalhe
- **CA02:** Sem score contextual, o usuário vê o estado de ausência e não confunde com o legado
- **CA03:** Testes cobrem ambos os estados, inclusive troca de rodada
- **CA04:** Build, lint e testes passam

## Definition of Done

- [ ] Tipos TypeScript estendidos com `overall_contextual_score` e `rodada_alvo`
- [ ] Testes de componente escritos antes da implementação e verdes
- [ ] Componentes de lista e detalhe atualizados
- [ ] Testes de integração passando (com/sem score contextual)
- [ ] Lint e build sem erros
- [ ] Cobertura de testes documentada
- [ ] PR vinculada a esta issue (#37) e ao épico (#9 do backend)
- [ ] Passo a passo de validação humana incluído no PR

## Fora de Escopo

- Refazer cálculo no cliente ou calibrar fórmula
- Alterar otimizador de rodada
- Mudar persistência ou cache de atletas
