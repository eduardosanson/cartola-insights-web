# Spec: Migração do Cliente Web para Proxy Server-Side

## Contexto de Negócio
Completa a #18 (proxy de API server-side publicado em #42). O navegador deve se comunicar com um proxy no **mesmo domínio** em vez de falar diretamente com o backend, removendo a necessidade de expor `VITE_SERVICE_TOKEN` no cliente. Isso prova e garante ausência do segredo no bundle de produção.

## Requisitos Funcionais

- RF01: Remover `VITE_SERVICE_TOKEN` do código cliente (client.ts) e não mais injetar header `X-Service-Token`
- RF02: Fazer `apiGet`, `apiPost` e `apiDelete` chamarem `/api/proxy/*` em vez do backend direto
- RF03: Preservar contrato de erro (401/403 com detalhes, 204 sem corpo, serialização JSON)
- RF04: Manter suporte a `credentials: 'include'` para sessão entre domínios mesmo (mesmo domínio)
- RF05: Remover referências a `VITE_SERVICE_TOKEN` de `.env.example`, tipos e documentação

## Requisitos Não-Funcionais

- RNF01: Build de produção não deve conter `VITE_SERVICE_TOKEN` nem seu valor no bundle
- RNF02: Build não deve conter referência literal à string `VITE_SERVICE_TOKEN` (verificação de segredo)
- RNF03: Comportamento deve ser idêntico em dev, preview e produção (sem fallback inseguro)
- RNF04: Função de proxy indisponível deve gerar erro visível e falhar, sem silenciosamente fazer chamada direta

## Critérios de Aceite

- CA01: GET/POST/DELETE para endpoints públicos e autenticados funcionam via proxy
- CA02: Login e logout funcionam via proxy, cookies de sessão preservados
- CA03: Tratamento de 401/403 funciona e diferencia "não autorizado" de "acesso negado"
- CA04: Inspeção do bundle confirma ausência de `X-Service-Token`, `VITE_SERVICE_TOKEN` e seu valor
- CA05: Aba Network do DevTools mostra requisições para `/api/proxy/*` e não para backend direto
- CA06: Roteamento da Vercel não captura função do proxy com fallback SPA (rotas específicas)

## Definition of Done

- [ ] Testes de client atualizado para nova base URL, proxy path e sem X-Service-Token
- [ ] Código cliente migrado: apiGet/apiPost/apiDelete chamam proxy
- [ ] `.env.example` atualizado: `VITE_SERVICE_TOKEN` removido
- [ ] Testes passando (coverage ≥ 90%)
- [ ] Build sem erros e bundle verificado quanto a segredos
- [ ] Roteamento da Vercel ajustado se necessário (`vercel.json` ou `_redirects`)
- [ ] PR linkado a #38 e #18
- [ ] Passo a passo de validação manual documentado

## Fora de Escopo

- Criar nova autenticação ou abrir acesso irrestrito
- Mudar contrato de autenticação (apenas remover exposição de segredo do cliente)
- Implementar retry automático após 429 (será entregue em #40)

## Dependências

- Depende de #18a (proxy server-side já publicado em PR #42)
- Testes de integração com login/logout devem validar sessão entre chamadas
