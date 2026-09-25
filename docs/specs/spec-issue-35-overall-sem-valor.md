# Spec: Overall sem valor por último na ordenação crescente (#35)

## Contexto de Negócio
Atletas sem Overall (`null`) apareciam primeiro na ordenação crescente por causa da sentinela `?? -1`, dificultando a comparação.

## Requisitos Funcionais
- RF01: Overall crescente e decrescente com `null` sempre ao final.
- RF02: desempate estável, outras colunas, filtro e paginação inalterados.

## Requisitos Não-Funcionais
- RNF01: usar a semântica de `useMultiSort`, sem alterar a API.
- RNF02: correção local à coluna Overall.

## Critérios de Aceite
- CA01: `null`, 0, 80 → crescente: 0, 80, `null`.
- CA02: mesmos dados → decrescente: 80, 0, `null`.
- CA03: ordenação combinada e demais colunas sem regressão.

## Definition of Done (DOD)
- [x] Teste reproduz o bug antes e passa depois
- [x] Lint, testes e build passando
- [x] PR vinculado à issue

## Fora de Escopo
Alterar cálculo/API de Overall; generalizar nulls last para outras métricas.
