# Prompt Plan: Mostrar Overall Contextual e Rodada na Lista e Detalhe de Atletas

## Ordem de Implementação

1. **Estender tipo `Atleta`**
   - Adicionar `overall_contextual_score: number | null` e `rodada_alvo: number | null`
   - Não quebra contrato legado: ambos são opcionais

2. **Criar testes para exibição do score contextual na lista (Jogadores)**
   - Teste com score contextual presente: verificar que valor e rodada são exibidos
   - Teste sem score contextual: verificar que "ainda não calculado" aparece
   - Teste de acessibilidade: scores e rodada devem ser lidos por leitor de tela
   - Teste de ordenação por score contextual (se implementado)

3. **Implementar exibição na lista (Jogadores)**
   - Adicionar coluna "Overall Contextual" na tabela (ou substituir a coluna legada com ambos os estados)
   - Exibir valor + rodada quando presente
   - Exibir "—" ou "Não calculado" quando ausente
   - Usar cores/tokens de CSS para diferenciar visualmente

4. **Criar testes para exibição no detalhe (DetalheJogador)**
   - Teste com score contextual: valor e rodada exibidos
   - Teste sem score contextual: estado de ausência aparece
   - Teste de legenda: informação sobre o modelo é clara

5. **Implementar exibição no detalhe (DetalheJogador)**
   - Adicionar seção de "Overall Contextual" na header do detalhe
   - Exibir valor, rodada e legenda
   - Manter legibilidade ao lado do Overall legado

6. **Testes de integração**
   - Mock da API com score contextual
   - Mock da API sem score contextual
   - Verificar que lista e detalhe combinam dados corretamente

7. **Validação e documentação**
   - Rodar testes com coverage
   - Rodar lint e build
   - Capturar evidência de lista e detalhe funcionando
   - Passo a passo de validação humana

## Dependências

- Depende da exposição pública da API em backend #62 (parte de #50) — contrato esperado:
  ```typescript
  overall_contextual_score?: number | null
  rodada_alvo?: number | null
  ```

## Riscos Identificados

- **Risco 1:** Ranking pode misturar valores de modelos/rodadas diferentes
  - **Mitigação:** Sempre exibir a rodada e modelo junto ao valor
  - **Mitigação:** Se ordenação for implementada depois, requer cuidado para não rangkear diferentes rodadas

- **Risco 2:** Estado "não calculado" pode ser confundido com Overall legado
  - **Mitigação:** Usar rótulo e cor distintos
  - **Mitigação:** Legenda visual clara no componente
