# Spec: Telas de Conta (roadmap geral — sub-projeto 2 da Fase 4a)

## Contexto de Negócio

O backend (`../backend`) já tem o contexto `contas` completo e mergeado em
`main`: registro, login (sessão via cookie httpOnly), API tokens pessoais
(bearer, revogáveis) e proteção por papel `admin` em `/admin/*` (ver
`../backend/spec-fase4a-auth-contas.md`). O web app hoje não tem nenhuma
tela de conta — as três telas existentes (Tabela, Jogadores, Detalhe do
jogador) são todas leitura pública, sem gate de login. Esta fase constrói
as telas que consomem o backend de contas: cadastro, login e uma área
"Minha conta" onde o usuário gera/revoga o próprio API token (usado depois
pelo MCP, Fase 5). As telas públicas continuam exatamente como estão —
sem exigir login.

## Requisitos Funcionais

- RF01: Tela "Entrar" (`/entrar`) — formulário de email/senha, chama
  `POST /contas/login`, e em caso de sucesso atualiza o estado de sessão e
  redireciona para `/`.
- RF02: Tela "Criar conta" (`/registrar`) — formulário de email/senha,
  chama `POST /contas/registro`; em caso de sucesso redireciona para
  `/entrar` com uma mensagem "conta criada, faça login" (o backend não loga
  automaticamente no registro).
- RF03: Tela "Minha conta" (`/conta`) — protegida: usuário não autenticado
  que acessa a rota é redirecionado para `/entrar`. Mostra email e papel do
  usuário logado, botão "Gerar token" que chama `POST /contas/tokens` e
  exibe o valor cru **uma única vez** (com botão copiar — o valor nunca
  mais é recuperável, nem desta sessão do navegador), e a lista de tokens
  existentes (id, criado em, revogado em) com ação de revogar
  (`DELETE /contas/tokens/{id}`) por linha.
- RF04: Logout — botão "Sair" chama `POST /contas/logout` e volta o estado
  de sessão para deslogado.
- RF05: Estado de sessão global — como o cookie de sessão é `httpOnly` (não
  legível por JS), o app pergunta ao backend (`GET /contas/me`) uma vez ao
  carregar para saber se há uma sessão válida; esse estado fica disponível
  para toda a árvore de componentes via um contexto único.
- RF06: Navegação dinâmica — a barra de navegação mostra "Entrar" quando
  deslogado; quando logado, mostra o email do usuário (link para
  `/conta`) e um botão "Sair".
- RF07: Estados de carregamento, vazio e erro nas três telas novas, mesmo
  padrão já usado nas telas existentes (RF04 do `spec.md` do MVP Web).

## Requisitos Não-Funcionais

- RNF01: Cobertura de testes ≥ 90%, mesma régua do restante do projeto.
- RNF02: Chamadas de API de contas isoladas em um módulo (`api/contas.ts`),
  seguindo o mesmo padrão de `api/atletas.ts`/`api/clubes.ts` — sem fetch
  espalhado pelos componentes.
- RNF03: Toda chamada à API (leitura ou escrita) envia `credentials:
  'include'`, necessário para o cookie de sessão ir e voltar entre origens
  diferentes (web em `:5173`, API em `:8000` no dev).
- RNF04: Sem dado fictício/mock em produção — tudo consome a API real do
  backend de contas.

## Modelo de Dados (cliente)

Nenhuma tabela nova — este sub-projeto só consome os endpoints já
existentes no backend (`POST/GET /contas/*`, ver spec do backend para o
contrato completo de request/response de cada um).

## Critérios de Aceite

- CA01: Login com credenciais corretas redireciona para `/` e a navegação
  passa a mostrar o email do usuário.
- CA02: Login com credenciais erradas mostra mensagem de erro na própria
  tela, sem navegar.
- CA03: Registro com sucesso redireciona para `/entrar` com mensagem de
  confirmação; registro com email já cadastrado mostra erro claro (409 do
  backend) sem navegar.
- CA04: Acessar `/conta` sem estar logado redireciona para `/entrar`.
- CA05: Gerar um token mostra o valor cru na tela; recarregar a página ou
  navegar e voltar para `/conta` nunca mais exibe esse valor (só metadados
  na listagem).
- CA06: Revogar um token da lista remove a possibilidade de reuso dele (o
  item aparece com `revogado_em` preenchido) sem afetar os demais tokens.
- CA07: Clicar em "Sair" volta a navegação para o estado deslogado
  imediatamente, sem recarregar a página inteira.
- CA08: Build de produção (`npm run build`) sem erros.

## Definition of Done (DOD)

- [x] Código implementado e compilando
- [x] Testes escritos e passando, cobertura ≥ 90%
- [x] Lint sem erros
- [x] Evidências (descrição das 3 telas com o fluxo completo)
- [x] Passo a passo de validação humana
- [ ] Merge em `main`

## Fora de Escopo

- Recuperação de senha, verificação de email — mesmo escopo já fechado no
  backend (`Fora de Escopo` do `spec-fase4a-auth-contas.md`).
- Gate de login nas telas públicas (Tabela/Jogadores/Detalhe) — decisão de
  produto já tomada: dado público do Cartola continua livre.
- UI de administração (aprovar/promover usuários) — não existe endpoint
  pra isso ainda no backend.
- Persistir preferência de "lembrar sessão" além do cookie de 7 dias já
  definido pelo backend.
