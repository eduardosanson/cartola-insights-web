# Spec: Fase 3e — Perfil de Risco (web)

## Contexto de Negócio

Consome `GET /atletas/{id}/perfil-risco`
(`backend/spec-fase3e-perfil-risco.md`) pra mostrar um selo simples em
`DetalheJogador`: quanto da pontuação do atleta vem de retorno direto
(gol, assistência, defesa de pênalti — discreto e imprevisível) versus
participação (desarme, finalização defendida, faltas sofridas etc. —
frequente e estável). Fase independente das demais sub-fases de
Visualização Avançada (3a-3d) — não depende do radar de atributos (3b)
nem de nenhum outro indicador dessa família; é um `fetch` a mais na mesma
página, com seu próprio componente.

## Requisitos Funcionais

- RF01: `DetalheJogador` busca `GET /atletas/{id}/perfil-risco` junto com
  as chamadas que já existem (atleta + histórico), e mostra um selo
  ("badge") com o percentual de risco e a classificação
  (baixo/médio/alto).
- RF02: O texto e a cor do selo vêm diretamente da `classificacao` que a
  API já resolve (`"baixo"` / `"medio"` / `"alto"`) — o cliente só traduz
  essas três chaves pra rótulo/cor via um dicionário fixo, sem reimplementar
  os limiares numéricos que já vivem no backend (mesmo princípio já em uso
  em `MandoRodada.tsx`: uma tabela `presentation` por chave discreta, sem
  lógica condicional numérica no componente).
- RF03: Se o endpoint retornar `404`, a tela mostra uma mensagem no lugar
  do selo (não quebra a página) — mesmo padrão já usado pra outros dados
  opcionais da página (histórico vazio, erro de rede): informativo, não
  bloqueia o resto do conteúdo.

## Requisitos Não-Funcionais

- RNF01: Cobertura ≥ 90%.
- RNF02: Sem lib de UI nova — `<span>`/CSS inline com as variáveis de cor
  já existentes em `theme.css` (`--accent-home`, `--accent-away`,
  `--danger`), mesmo padrão de `MandoRodada.tsx`.

## Critérios de Aceite

- CA01: Dado um atleta com `classificacao: "alto"`, quando a página
  carrega, então o selo mostra o texto "Risco alto" (ou equivalente) na
  cor `var(--danger)`.
- CA02: Dado um atleta com `classificacao: "medio"`, quando a página
  carrega, então o selo usa a cor `var(--accent-away)` (mesma cor já usada
  pra "fora"/mando visitante — reaproveitada, não uma cor nova só pra
  isso).
- CA03: Dado um atleta com `classificacao: "baixo"`, quando a página
  carrega, então o selo usa a cor `var(--accent-home)`.
- CA04: Dado um atleta sem perfil de risco (404 do backend), quando a
  página carrega, então aparece o texto do `detail` retornado pelo backend
  no lugar do selo — a página não quebra nem mostra um selo vazio.
- CA05: Dado um atleta com perfil de risco, quando o selo é exibido, então
  o percentual (`risco_percentual`) aparece formatado com `formatNumber`
  (mesmo utilitário já usado no resto da página, garante separador decimal
  `pt-BR` consistente).

## Definition of Done (DOD)

- [ ] Código implementado e compilando
- [ ] Testes escritos e passando, cobertura ≥ 90%
- [ ] Lint sem erros
- [ ] Evidências capturadas (`docs/evidence/fase3e-perfil-risco.md`)
- [ ] Passo a passo de validação humana escrito
- [ ] Integrado em `main`

> Roadmap será atualizado centralmente depois que 3c+3d, 3e e Fase 5
> estiverem todos prontos — não há task de "atualizar roadmap" nesta fase.

## Fora de Escopo

- Ordenação/filtro por risco na listagem (`Jogadores.tsx`) — só
  `DetalheJogador` consome este indicador nesta fase (mesmo recorte já
  decidido no `backend/spec-fase3e-perfil-risco.md`).
- Gráfico/visualização mais elaborada (barra de composição
  retorno-direto/participação, por exemplo) — um selo de texto com cor já
  comunica a classificação; visualização mais rica fica pra depois se o
  feedback pedir (mesmo raciocínio do radar da Fase 3b: começar simples).
- Tooltip explicando a metodologia (o que conta como "retorno direto") —
  fora de escopo desta primeira versão; o rótulo por si só (baixo/médio/
  alto risco) já é o valor entregue.
