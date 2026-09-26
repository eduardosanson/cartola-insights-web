# Spec: Corrigir ordenação de Overall no comparador (Issue #43)

## Contexto de Negócio
Atletas sem Overall (overall_score === null) aparecem antes dos que têm valor quando a ordenação é crescente no comparador de jogadores, criando uma anomalia idêntica à corrigida na tabela de jogadores pela PR #41. O comparador usa uma sentinela numérica (-1) que conflita com o já-correto comportamento de `useMultiSort`.

## Requisitos Funcionais
- RF01: Ordenar Overall no comparador com `null` sempre ao final, na ordem crescente e na decrescente
- RF02: Manter desempate estável; demais colunas sem regressão

## Requisitos Não-Funcionais
- RNF01: Reutilizar a semântica de `useMultiSort`; sem alterar contrato da API
- RNF02: Testes devem passar com cobertura ≥ 90%

## Critérios de Aceite
- CA01: Com Overall `null`, 0 e 80, ordem crescente é 0, 80, `null`
- CA02: Ordem decrescente é 80, 0, `null`
- CA03: Teste de mutação continua útil (sem depender da sentinela) e demais colunas não regridem

## Arquivos Impactados
- `src/components/ModalCompararJogador.tsx:18` — remove sentinel `?? -1`
- `src/components/ModalCompararJogador.test.tsx:832` — atualiza teste acoplado

## Definition of Done
- [ ] Teste reproduz bug antes da correção e passa depois
- [ ] Skills de teste e build do web passam
- [ ] PR criada com evidências e validação humana
