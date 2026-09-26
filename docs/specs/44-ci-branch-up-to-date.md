# Spec: CI Branch Up-to-Date Check

## Contexto de Negócio

Em 2026-09-26, dois PRs (#65 e #66) foram mergeados em sequência. O CI do #66 rodou sobre uma base sem o #65, deixando duas heads do Alembic (ferramenta de migrations) e travando o deploy (#68). O repositório `board-poller` já possui esse check via workflow `branch-up-to-date.yml`; precisamos replicar em `cartola-insights-web`.

## Requisitos Funcionais

- **RF01**: Workflow `branch-up-to-date.yml` que falha quando a branch do PR não contém o HEAD atual da `main`.
- **RF02**: O check reavalia automaticamente quando a `main` avança (evento `push` na main reavaliando PRs abertos).

## Requisitos Não-Funcionais

- **RNF01**: Sem impacto no tempo do CI principal (workflow deve ser rápido, apenas git operations).

## Critérios de Aceite

- **CA01**: PR com branch atrasada em relação à `main` → check `check-branch-up-to-date` falha (status red).
- **CA02**: PR com branch atualizada → check `check-branch-up-to-date` passa (status green).
- **CA03**: Teste de configuração em `tests/test_ci_config.py` valida que o workflow existe e é acionado em `pull_request` e `push` (main).

## Definition of Done

- [ ] Teste de configuração escrito e passando
- [ ] Workflow `branch-up-to-date.yml` criado em `.github/workflows/`
- [ ] CI verde (todos os testes e lint passando)
- [ ] Evidência capturada: screenshot de um PR atrasado bloqueado pelo check
- [ ] Passo a passo de validação humana documentado

## Dependências e Riscos

- Nenhuma dependência externa.
- Risco baixo: mudança apenas no CI, sem impacto em código de produção.
- Nota: Sem branch protection no plano atual (#51), o check é informativo; board-poller e merge assistido já respeitam esse check.

## Fora de Escopo

- Implementação de branch protection (#51).
- Integração com auto-merge ou rebase automático.
