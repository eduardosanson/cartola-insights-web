# Prompt Plan: CI Branch Up-to-Date Check

## Ordem de Implementação

1. **Teste de configuração CI** — Validar que workflow existe e roda em `pull_request` e `push` (main)
   - Localizar ou criar `tests/test_ci_config.py`
   - Escrever teste que busca o arquivo `.github/workflows/branch-up-to-date.yml`
   - Validar que o evento `pull_request` está presente no workflow
   - Validar que o evento `push` com branch `main` está presente
   - Teste deve falhar até workflow estar criado

2. **Criar workflow `branch-up-to-date.yml`** — Implementar o check
   - Localizar/entender a saída esperada (basicamente replicar padrão GitHub)
   - Criar `.github/workflows/branch-up-to-date.yml` com:
     - Disparo em `pull_request` (todo PR)
     - Disparo em `push` na branch `main` (reavaliação de PRs abertos)
     - Job que faz `git fetch origin main`
     - Verifica se a branch atual é um ancestral ou igual a `origin/main`
     - Falha se branch está atrasada
   - Commit com mensagem: `chore: #44 — workflow para validar branch up-to-date`

3. **Validar teste passa** — Rodar suite de testes
   - Executar `cartola-insights-web-test` (ou equivalente)
   - Confirmar que `test_ci_config.py` passa
   - Confirmar que nenhum outro teste foi quebrado

4. **Validar lint e build** — Garantir qualidade
   - Executar `cartola-insights-web-build` para typecheck e build
   - Confirmar que não há erros

5. **Capturar evidências** — Documentar funcionamento
   - Criar PR teste (se possível com branch atrasada) ou referenciar um existente
   - Capturar screenshot do check falhandose branch está atrasada
   - Capturar screenshot do check passando quando branch está atualizada
   - Registrar os outputs em `docs/evidence/44-ci-branch-up-to-date/`

## Dependências

- Nenhuma (mudança isolada ao CI)

## Riscos Identificados

- **Risco baixo**: O workflow é apenas validação de git, sem efeito colateral

## Notas de Implementação

- O workflow será acionado automaticamente pelo GitHub Actions
- Cada novo push na `main` vai reavaliando PRs abertos (conforme RF02)
- O check será visível como "check-branch-up-to-date" no PR
