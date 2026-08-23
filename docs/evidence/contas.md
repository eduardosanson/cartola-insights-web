# Evidências: Telas de Conta (feature-telas-conta)

## Resumo da Feature

Implementação completa das telas de conta do Cartola Insights Web: registro de novo usuário, login e gerenciamento de API tokens na área "Minha conta". A feature integra-se ao backend de autenticação (`../backend`) via endpoints existentes: `POST /contas/registro`, `POST /contas/login`, `POST /contas/logout`, `GET /contas/me` (state detection) e `POST/GET/DELETE /contas/tokens` (token management).

## Arquivos Criados e Modificados

### Diff Summary
- **Total**: 20 arquivos, 1377 insertões, 29 deleções
- **Base**: `5e2bcd3` → **HEAD** (branch `feature/telas-conta`, commit `70471a3`, via `git diff --stat 5e2bcd3..HEAD`)
- O total inclui os 18 arquivos de código/teste da feature (12 novos + 6 modificados, detalhados abaixo) mais os 2 arquivos de planejamento/evidência (`docs/evidence/contas.md`, `../specs/spec-contas.md`). O número está fixo em `70471a3` — o último commit de código antes deste arquivo de evidência ser escrito — então não muda com esta edição nem com futuras edições deste arquivo.

### Novos Arquivos (12)

| Arquivo | Tipo | Responsabilidade |
|---------|------|------------------|
| `src/api/contas.ts` | API Module | Endpoints de contas isolados: registro, login, logout, estado, tokens |
| `src/contexts/AuthContext.tsx` | Context | Estado global de sessão (autenticado/desautenticado, email, papel) |
| `src/components/RotaProtegida.tsx` | Component | HOC que redireciona para `/entrar` se não autenticado |
| `src/pages/Login.tsx` | Page | Tela de login (email/senha) com mensagens de erro |
| `src/pages/Registro.tsx` | Page | Tela de cadastro com redirecionamento para `/entrar` pós-sucesso |
| `src/pages/MinhaConta.tsx` | Page | Tela protegida: mostra email, papel, gera/revoga tokens |
| `src/contexts/AuthContext.test.tsx` | Test | 4 testes de contexto de autenticação |
| `src/components/RotaProtegida.test.tsx` | Test | 3 testes de proteção de rotas |
| `src/pages/Login.test.tsx` | Test | 3 testes de formulário e fluxo de login |
| `src/pages/Registro.test.tsx` | Test | 2 testes de formulário e fluxo de registro |
| `src/pages/MinhaConta.test.tsx` | Test | 6 testes de estado, geração/revogação de tokens e resiliência de erro |
| `src/api/contas.test.ts` | Test | 7 testes de endpoints e tratamento de erros |

### Arquivos Modificados (6)

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionadas 3 rotas novas: `/entrar`, `/registrar`, `/conta` (protegida por `RotaProtegida`); `AuthProvider` envolvendo a árvore de rotas |
| `src/App.test.tsx` | 2 testes: o smoke test original (`<h1>` renderiza) e um teste de integração que renderiza o `<App />` real (rotas + `RotaProtegida` de fato usados em produção) e confirma que `/conta` redireciona para `/entrar` quando não autenticado |
| `src/components/Nav.tsx` | Dinâmica baseada em estado de autenticação: "Entrar" (deslogado) → email + "Sair" (logado) |
| `src/components/Nav.test.tsx` | 3 testes da Nav com estado de autenticação (deslogado, logado, logout que falha mas não trava a navegação) |
| `src/api/client.ts` | Adicionados `apiPost` e `apiDelete` + `credentials: 'include'` globalmente (cookies em CORS) |
| `src/api/client.test.ts` | 7 testes de helpers HTTP (`apiGet`/`apiPost`/`apiDelete`) com tratamento de erro e credentials |

## Test Suite Summary

```
Test Files   16 passed (16)
Tests        75 passed (75)
Duration     2.65s

% Coverage Report (v8)
────────────────────────────────────────────────
Statements   96.41% (269/279)
Branches     93.49% (158/169)
Functions    95.23% (100/105)
Lines        96.78% (241/249)
────────────────────────────────────────────────
```

**Análise**: Cobertura acima do requisito (≥90%):
- `src/components`: 96.77% statements / 96.55% branches / 100% functions / 100% lines (única lacuna: `MandoRodada.tsx` linha 19)
- `src/pages`: 94.4% statements / 89.89% branches / 92.06% functions / 94.59% lines
- Uncovered lines por arquivo (relatório `npm run coverage`): `MandoRodada.tsx:19`, `DetalheJogador.tsx:19,29`, `Jogadores.tsx:15-16,109-114`, `Login.tsx:33`, `MinhaConta.tsx:30,42-48`, `Tabela.tsx:26` — todas são ramos de erro secundários ou early-returns, não caminhos felizes.

**Nota sobre MinhaConta.tsx (85.18% statements/lines, 83.33% branches)**: Os testes unitários cobrem o path feliz completo (listar, gerar, revogar, estado vazio, o botão "Gerar token" desabilitado durante a chamada, e a lista permanecendo visível quando uma ação subsequente falha). O que fica descoberto são dois ramos de erro específicos — o `catch` de `handleGerarToken` (linha 30) e o `catch` de `handleRevogar` mais a função `handleCopiar` (linhas 42-48, que depende de `navigator.clipboard`, indisponível/instável em jsdom) — cobertos apenas pela validação manual (ver seção "Validação Humana"). Ambos são exercidos deliberadamente fora do escopo de teste automatizado desta rodada de correções (o floating-promise do clipboard é um item Minor já triado como não bloqueante).

## Passo a Passo de Validação Humana

### Pré-requisitos

1. **Backend rodando**: No diretório `../../backend`, executar:
   ```bash
   docker compose up
   ```
   (Assumindo que o leitor já tem o setup completo do backend conforme `../backend/README.md`)

2. **Dev server rodando**: No diretório atual (`.worktrees/feature-telas-conta`), em outro terminal:
   ```bash
   npm run dev
   ```
   O app estará disponível em `http://localhost:5173`.

3. **API backend disponível**: Confirmar que `http://localhost:8000` responde (healthcheck ou qualquer GET).

### Fluxo Completo

#### 1️⃣ Tela de Registro (`/registrar`)

1. Acesse `http://localhost:5173/registrar`
   - Deve exibir um formulário com campos "Email" e "Senha" e o botão "Criar conta"
   - O botão não fica desabilitado por campos vazios (a validação é feita pelos atributos HTML `required`/`minLength` do formulário); ele só fica desabilitado — com o texto "Criando…" — enquanto o envio está em andamento

2. Preencha com dados de teste:
   - Email: `teste@example.com` (ou qualquer email único)
   - Senha: pelo menos 8 caracteres (`minLength={8}` no campo) — ex.: `senha123`

3. Clique "Criar conta"
   - Esperado: Redirecionamento para `/entrar` com a mensagem: _"Conta criada! Faça login."_ (texto simples em um `<p role="status">`, sem estilo de cor aplicado)
   - Confirmação: A barra de navegação ainda mostra "Entrar" (não autenticado)

4. **Caso de erro**: Tente registrar novamente com o mesmo email
   - Esperado: Permanece na tela de registro (HTTP 409) e exibe mensagem de erro cujo texto vem direto do backend, no formato `email já cadastrado: teste@example.com` (ver `registrar_usuario.py`)
   - O formulário permanece preenchido para permitir correção

#### 2️⃣ Tela de Login (`/entrar`)

1. Acesse `http://localhost:5173/entrar` (ou já esteja lá da etapa anterior)

2. Preencha com as credenciais criadas em 1️⃣:
   - Email: `teste@example.com`
   - Senha: `senha123`

3. Clique "Entrar"
   - Esperado: Redirecionamento para `/tabela` (rota padrão pós-login: `App.tsx` redireciona `/` → `/tabela`)
   - Confirmação: A barra de navegação agora mostra `teste@example.com` (em vez de "Entrar") + botão "Sair"

4. **Caso de erro**: Clique em "Entrar" novamente com senha errada
   - Esperado: Permanece na tela e exibe a mensagem de erro `email ou senha inválidos` (formato exato retornado pelo backend, ver `autenticar_usuario.py`)
   - O formulário não é limpo, permitindo retry

#### 3️⃣ Tela "Minha conta" (`/conta`) — rota protegida

1. Clique em `teste@example.com` na barra de navegação
   - Esperado: Navegação para `/conta`
   - Exibe: email, papel do usuário (valor real: `usuario`, não `admin`) e a seção de tokens

2. **Gerar token**:
   - Clique no botão "Gerar token" (o botão fica desabilitado e mostra "Gerando…" enquanto a chamada está em andamento — evita clique duplo gerar duas credenciais reais, já que o backend confirma a criação a cada chamada)
   - Esperado: Aparece um bloco com:
     - O token cru dentro de uma tag `<code>` (não um `<input>`) — é um valor aleatório gerado por `secrets.token_urlsafe(32)` no backend, sem prefixo (não há `tok_` nem qualquer outro marcador)
     - Botão "Copiar" (copia para clipboard via `navigator.clipboard`)
   - Para copiar: selecione manualmente o texto dentro do `<code>` (Ctrl+C) ou use o botão "Copiar"

3. **Validar comportamento único do token**:
   - Recarregue a página (F5)
   - Esperado: O token cru **desaparece** — só a lista de tokens é visível, com as colunas "Criado em" e "Status" (não exibe o `id` do token)
   - Tente navegar para `/tabela` e voltar para `/conta` — o valor ainda não reaparece

4. **Revogar token**:
   - Na lista de tokens, localize o que foi gerado
   - Clique "Revogar" na linha correspondente
   - Esperado: O status da linha muda de "Ativo" para "Revogado"; o botão "Revogar" desaparece (não é mais possível revogar um token já revogado)

5. **Resiliência a erro**: com um token já listado na tela, force uma falha de rede momentânea (ex.: desligue o backend) e clique "Revogar"
   - Esperado: Aparece a mensagem de erro (`role="alert"`), mas a lista de tokens carregada anteriormente continua visível — nenhuma linha desaparece por causa do erro

6. **Gerar segundo token** (opcional):
   - Repita o passo 2️⃣ (com o backend disponível novamente)
   - Confirme que gerar um novo token não afeta o anterior (revogado continua na lista)

#### 4️⃣ Logout

1. Clique no botão "Sair" na barra de navegação (disponível em qualquer tela quando logado)
   - Esperado: **Imediatamente** (sem recarregar):
     - Barra de navegação volta a exibir "Entrar"
     - Você é redirecionado para `/tabela` (a Nav navega para `/`, que `App.tsx` redireciona para `/tabela`)

2. Tente acessar `/conta` diretamente
   - Esperado: Redirecionamento automático para `/entrar`
   - A página de conta **não carrega** — `RotaProtegida` bloqueia o acesso

3. Veja que as telas públicas ainda funcionam:
   - `/tabela` — lista de rodadas (sem gate de login)
   - `/jogadores` — lista de jogadores (sem gate de login)
   - `/jogadores/:id` — detalhe de jogador (sem gate de login)
   - **Confirmação**: As telas públicas permanecem exatamente como antes — nenhuma tela pública foi alterada para exigir login

### Validação de Build

```bash
npm run build
```

Esperado: Sem erros. Se houver falhas de TypeScript, resolve todos os erros antes de considerar validação concluída.

## Notas de Implementação

### Session State Detection

Como o cookie de sessão é `httpOnly` (não legível por JavaScript), o app não consegue saber se está autenticado apenas lendo a cookie. Solução implementada:

- `AuthContext` faz um `GET /contas/me` **uma única vez** na montagem do app (hook `useEffect` na raiz do provider)
- Resposta bem-sucedida (200) indica autenticação; erro 401 indica sessão inválida ou expirada
- Estado global é atualizado e fica disponível para toda a árvore de componentes
- Chamadas subsequentes a qualquer endpoint já enviam o cookie automaticamente (configurado em `client.ts` com `credentials: 'include'`)

### API Token Display Once

A exibição única do token cru é implementada com estado local (`useState`) na página `MinhaConta`:

1. Ao gerar token, o backend retorna o valor cru apenas essa vez — a resposta de `POST /contas/tokens` contém somente `{ id, token }` (`ApiTokenCriadoResponse` no backend); não inclui `criado_em`/`revogado_em`
2. O componente armazena o valor em state: `tokenGerado`
3. Ao recarregar ou navegar para outra página, o state é descartado
4. A listagem de tokens (via `GET /contas/tokens`) sempre retorna metadados (`id`, `criado_em`, `revogado_em`), nunca o valor cru

### Geração de token protegida contra duplo clique

`gerar_api_token` no backend commita incondicionalmente a cada chamada — cada clique em "Gerar token" gera uma credencial real e persistente. O botão fica `disabled` (com o rótulo "Gerando…") enquanto a chamada está em andamento, evitando que um duplo clique deixe uma segunda credencial válida "órfã" (cujo valor cru nunca chegaria a ser mostrado, pois só o último token gerado fica em state).

### Erro em uma ação não esconde a lista já carregada

Os três estados de exibição da lista (`carregando`, `vazio`, `tabela`) são controlados exclusivamente pelo estado `tokens`, independente do estado `erro`. Assim, se uma ação subsequente (ex.: o refresh após revogar) falhar, a mensagem de erro aparece mas a última lista carregada com sucesso continua visível — o usuário não perde a visão dos tokens existentes por causa de uma falha pontual.

### main.tsx Fix

Uma defect foi detectada durante a validação final: `main.tsx` tinha uma duplicação não-autorizada de `AuthProvider` (adicionada por um task anterior sem coordenação, já que `App.tsx` já provia o provider). Isso causaria double-wrapping.

**Status**: Identificado e revertido — o arquivo agora está exatamente como estava antes da feature, com apenas `App.tsx` provendo `AuthProvider`.

Verificação:
```bash
git show main.tsx | grep AuthProvider
```
Resultado esperado: Nenhuma ocorrência de `AuthProvider` em `main.tsx` (provider está em `App.tsx`).

## Decisões Registradas

Ver `docs/decisions/[ISSUE-ID].md` para decisões arquitecturais e trade-offs (estrutura de módulos HTTP, timing de `GET /contas/me`, fluxo de validação de tokens, etc.).

---

**Conclusão**: Todas as 8 CA passam, testes em verde (75/75), build limpo, lint sem erros, cobertura 96.41% statements (bem acima do requisito de ≥90%), navegação funciona como especificado. A branch ainda não foi mergeada em `main` — o merge acontece fora do escopo deste documento.
