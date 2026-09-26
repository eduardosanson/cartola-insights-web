# Prompt Plan: Aguardar Quota do Escalador e Recalcular Automaticamente

## Ordem de Implementação

1. **Expandir ApiError** — adicionar campos `code` e `retryAfter` para exposição de código e prazo
   - Testes unitários para parsing de `code` do corpo da resposta
   - Testes unitários para parsing de `Retry-After` do header

2. **Atualizar client.ts** — reconhecer 429 e extrair `code` + `Retry-After`
   - Modificar `extrairMensagemDeErro()` para buscar `code` no corpo
   - Detectar header `Retry-After` na resposta
   - Criar ApiError com `code` e `retryAfter` para 429
   - Testes para reconhecimento de 429 com quota válida
   - Testes para 429 sem código/prazo válido (firewall)

3. **Atualizar otimizador.ts** — expor `code` e `retryAfter` no tratamento de erros
   - `montarEscalacao()` deve permitir que ApiError com `code` escape para o componente
   - Testes para erro de quota ser reconhecível pelo componente

4. **Implementar retry no Escalador.tsx** — máquina de estados para espera e retry
   - Estado: idle, loading, waiting_retry, showing_result, error
   - Timer cancelável durante espera
   - Congelar parâmetros (orçamento, esquema, modo) durante retry
   - Desabilitar botão e campos durante espera
   - Botão "Cancelar" que limpa estado de retry
   - AbortController para cancelar requisição em voo ao desmontar
   - Testes com relógio controlado (vitest fake timers)
   - Testes para CA01, CA02, CA03, CA04, CA05

5. **UI de estado de espera** — overlay e mensagem amigável
   - Overlay na área de resultado
   - Mensagem: "Preparando sua escalação. Aguarde um instante…"
   - Respeitar `prefers-reduced-motion`
   - Acessibilidade: `role=status` para anúncio

6. **Limpeza de boundary cases** — garantir cancelamento seguro
   - Ignorar resolução tardia de timer após desmontar
   - Ignorar resultado de requisição antiga após uma nova
   - Testes com StrictMode (cleanup duplo do efeito)

7. **Testes de integração** — fluxo completo end-to-end
   - Sucesso após espera de 429
   - Dois 429 consecutivos com prazos diferentes
   - Cancelamento durante espera
   - Unmount durante espera
   - Erro 422 durante retry (não entra em loop)
   - Erro 500 durante retry (não entra em loop)
   - 429 sem código válido (trata como erro normal)

8. **Validação de teste e build**
   - `cartola-insights-web-test` deve passar com cobertura ≥ 90%
   - `cartola-insights-web-build` deve passar sem erros
   - Lint sem erros

## Dependências

- Depende da resposta 429 do backend ter formato `{ code: "optimization_quota_exceeded", ... }`
- Depende do header `Retry-After` estar presente na resposta 429
- Depende do proxy preservar ambos (body e header)

## Riscos Identificados

- **Risco 1:** Outros navegadores/abas podem consumir quota durante a espera → usar sempre novo `Retry-After` de cada resposta, mantendo opção de cancelar
- **Risco 2:** Timer vazar para background → usar AbortController e cleanup em unmount/novo envio
- **Risco 3:** Race condition entre resolução tardia e novo envio → usar abort-aware Promise.race ou verificação de `ativo` flag
