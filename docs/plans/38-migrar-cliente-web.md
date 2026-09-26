# Prompt Plan: Migração do Cliente Web para Proxy Server-Side

## Ordem de Implementação (TDD)

1. [ ] **Atualizar testes do client.ts**
   - Remover testes da suite "X-Service-Token e tratamento de autenticação" que testam injeção de token
   - Criar novos testes que verificam chamadas para `/api/proxy/*` em vez de backend direto
   - Preservar testes de contrato de erro (401/403, 204, etc.)
   - Verificar que `X-Service-Token` NÃO é injetado

2. [ ] **Migrar client.ts para chamar proxy**
   - Manter `API_BASE_URL` para fallback, mas usar `/api/proxy` como prefixo
   - Remover leitura de `VITE_SERVICE_TOKEN` completamente
   - Remover headers de `X-Service-Token` da função `requisitar()`
   - Preservar `credentials: 'include'` para sessão
   - Executar testes para garantir green

3. [ ] **Remover VITE_SERVICE_TOKEN de .env.example**
   - Remover linhas que mencionam `VITE_SERVICE_TOKEN`
   - Manter `VITE_API_BASE_URL` e adicionar comentário sobre proxy
   - Manter variáveis server-side (SERVICE_TOKEN, etc.)

4. [ ] **Verificar arquivos de tipo e configuração**
   - Procurar por qualquer referência a `VITE_SERVICE_TOKEN` em:
     - `vite.config.ts` (tipos Vite env)
     - `vite-env.d.ts` (declarations)
     - `tsconfig.json` (se houver env vars definidas)
   - Remover referências encontradas

5. [ ] **Validar roteamento da Vercel** (se aplicável)
   - Verificar `vercel.json` ou `_redirects` ou config de fallback SPA
   - Garantir que `/api/proxy/*` não é capturado por fallback de SPA
   - Garantir que `/api/proxy/*` é roteado para função serverless

6. [ ] **Executar build e teste com coverage**
   - `npm run test` — todos testes passando, coverage ≥ 90%
   - `npm run build` — build sem erros
   - `npm run test -- --coverage` — verificar coverage final

7. [ ] **Verificar bundle quanto a segredos**
   - Descompactar `dist/*.js` e verificar ausência de:
     - `VITE_SERVICE_TOKEN`
     - `X-Service-Token` (literal)
     - Padrão de token (se houver teste com token mockado)
   - Gerar relatório de bundle size

8. [ ] **Criar evidências e documentação**
   - Passo a passo de como validar a feature manualmente (dev, preview, prod)
   - Screenshots da aba Network mostrando requisições para `/api/proxy/*`
   - Log de bundle size antes/depois
   - Resultado de verificação de segredos

## Dependências

- Proxy server-side já publicado (#42, issue #18a)
- Nenhuma dependência de bloqueio para TDD — todos os testes podem ser reescritos

## Riscos Identificados

- **Risco**: Se roteamento da Vercel não estiver ajustado, requisições podem ser capturadas pelo fallback SPA
  - **Mitigação**: Verificar e ajustar `vercel.json` antes de verificar evidências em produção
  
- **Risco**: Cookies de sessão em domain/Path distintos (dev vs preview vs prod)
  - **Mitigação**: Testar login/logout em cada ambiente; verificar que session cookie é reutilizado em chamadas sucessivas

- **Risco**: Referências residuais a `VITE_SERVICE_TOKEN` em comentários ou testes antigos
  - **Mitigação**: Grep completo por `VITE_SERVICE_TOKEN` e `X-Service-Token` no final

## Comandos de Validação

```bash
# Testes
npm run test -- src/api/client.test.ts

# Build e coverage
npm run build
npm run test -- --coverage

# Verificar bundle quanto a segredos
unzip -p dist/assets/index-*.js | strings | grep -i "service-token\|vite_service"

# Grep para referências residuais
grep -r "VITE_SERVICE_TOKEN\|X-Service-Token" src/ --include="*.ts" --include="*.tsx"
```
