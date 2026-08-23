# Log de Decisões — Fase 3e (Perfil de Risco, web)

## DOR → SPEC → PROMPT PLAN — 2026-08-23

- Decisão: `SeloRisco` segue exatamente o padrão de `MandoRodada.tsx` — um
  dicionário `presentation` indexado pela chave discreta que a API já
  resolve (`classificacao: "baixo"|"medio"|"alto"`), sem reimplementar
  nenhum limiar numérico no cliente. Verificado que as três cores já
  existem em `theme.css` sem precisar de nenhuma variável nova
  (`--accent-home` pra baixo, `--accent-away` pra médio — mesma cor já
  usada pro mando "fora" —, `--danger` pra alto), então esta fase não toca
  em `theme.css`.
- Decisão: confirmado rodando teste real (`toHaveStyle({ color:
  'var(--danger)' })` contra um elemento com `style={{ color:
  'var(--danger)' }}`) que o `jest-dom`/`jsdom` usados neste projeto
  comparam o valor literal do atributo `style`, não o CSS resolvido — não
  seria necessário mockar `getComputedStyle` nem resolver a variável pra
  um hex antes de testar. Evita reinventar a asserção de cor de um jeito
  mais frágil do que o resto do projeto já usa.
- Risco aceito: os testes existentes de `DetalheJogador.test.tsx` que não
  mockam `buscarPerfilRiscoAtleta` explicitamente vão deixar essa chamada
  sem mock (`fetch` real, que falha no ambiente de teste) — seguro pro
  comportamento (RF03: erro não quebra a página), mas gera uma promise
  rejeitada "solta" nesses testes se ninguém mockar. Mitigado no prompt
  plan (Task 3) com a orientação de mockar em todos os testes existentes,
  não só nos dois novos — decisão de implementação de como (por teste ou
  `beforeEach`) deixada pra quem executar, não trava a spec.
