# Spec: MVP Web (Fase 2 do roadmap geral)

## Contexto de Negócio

O backend (`../backend`) tem dados reais de uma temporada inteira do
Cartola FC ingeridos e três novos endpoints de consulta
(`spec-fase2-consulta.md` no backend): lista/busca de atletas, histórico
de pontuação e tabela de clubes. Esta fase constrói a primeira interface
web navegável consumindo esses dados reais — substituindo a POC (dados
fictícios, feita como artifact em uma sessão anterior) por telas de
verdade. Radar de atributos, raio-X de confronto e perfil de risco (que
a POC também demonstrava) ficam pra uma fase seguinte.

## Requisitos Funcionais

- RF01: Tela "Tabela do campeonato" — lista de clubes com média de
  pontos em casa e fora (`GET /clubes`).
- RF02: Tela "Jogadores" — lista paginada de atletas com busca por nome
  e filtro por posição, mostrando nome, clube, posição, preço e médias
  geral/casa/fora (`GET /atletas`).
- RF03: Tela "Detalhe do jogador" — dados e médias do atleta obtidos por
  `GET /atletas/{id}` + histórico das últimas pontuações com os scouts de
  cada partida (`GET /atletas/{id}/historico`), inclusive em acesso direto
  ou após recarregar a página.
- RF04: Estados de carregamento, vazio (sem resultado na busca) e erro
  (API indisponível) em toda tela que busca dado.
- RF05: Layout responsivo, tema claro/escuro (o artifact-design já
  provou o par cor/tipografia — reaproveitar a mesma identidade visual
  da POC: verde-turfe/ocre casa-fora, Barlow Condensed + Karla).
- RF06: Ordenação múltipla por média casa/fora na tabela de clubes e por
  preço/médias na lista de jogadores, com alternância descendente,
  ascendente e remoção de cada critério.
- RF07: Preços, médias e pontuações são exibidos com no máximo duas casas
  decimais, mantendo os valores brutos para cálculos e ordenação.
- RF08: A lista e o detalhe de jogadores exibem a maior rodada sincronizada e
  o mando do clube (`casa`, `fora` ou `sem_jogo`).

## Requisitos Não-Funcionais

- RNF01: Cobertura de testes ≥ 90%.
- RNF02: Cliente de API isolado (um módulo, não chamadas `fetch` espalhadas
  pelos componentes) — facilita trocar a URL base por ambiente.
- RNF03: Sem dado fictício/mock em produção — tudo vem da API real.

## Critérios de Aceite

- CA01: Buscar por nome/posição na tela de jogadores atualiza a lista
  sem recarregar a página.
- CA02: Clicar num jogador abre o detalhe com histórico real (não vazio,
  dado que a temporada tem dado ingerido).
- CA03: API fora do ar (erro de rede) mostra mensagem de erro clara em
  vez de tela em branco ou quebrada.
- CA04: Build de produção (`npm run build` / `vite build`) sem erros.
- CA05: Acessar diretamente `/jogadores/{id}` carrega nome, médias e histórico
  sem depender de estado de navegação anterior.
- CA06: Combinar dois critérios respeita a prioridade visual indicada nos
  cabeçalhos; remover um critério preserva os demais.
- CA07: Nenhum preço, média ou pontuação exibe mais de duas casas decimais.
- CA08: Jogadores de clubes mandantes e visitantes são identificados
  corretamente, e clubes ausentes da rodada aparecem como sem jogo.

## Definition of Done (DOD)

- [x] Código implementado e compilando
- [x] Testes escritos e passando, cobertura ≥ 90%
- [x] Lint sem erros
- [x] Evidências (screenshot ou descrição das 3 telas com dado real)
- [x] Passo a passo de validação humana
- [x] Merge em `main`

## Fora de Escopo

- Radar de atributos, raio-X de confronto, perfil de risco, probabilidade
  de pontuar (fase seguinte, depende de mais endpoints no backend).
- Autenticação, tabela oficial de classificação do Brasileirão (W/D/L) —
  "tabela" aqui é a média de pontos Cartola, não a tabela do campeonato
  real de futebol.
- Deploy/hospedagem pública (roda local via `npm run dev` contra o
  backend local por enquanto).
