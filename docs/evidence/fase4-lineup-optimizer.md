# Evidências — Fase 4 (web): Lineup Optimizer

**Data:** 2026-08-25
**Rota:** `/escalador`

## Entrega

- Cliente tipado para `GET /otimizador/esquemas` e `POST /otimizador/escalar`.
- `ApiError` preserva o status HTTP e `EscalacaoInviavelError` distingue o `422` de inviabilidade.
- Formulário com orçamento, seis esquemas carregados da API e os modos Liga Clássica, Tiro Curto e Patrimônio.
- Explicação do objetivo de cada modo e estado visível de `Calculando…`.
- Campo tático responsivo organizado em ataque, meio, defesa, gol e técnico.
- Cards com nome, posição, preço e objetivo rotulado por modo; cada atleta linka para `/jogadores/{id}`.
- Resumo de custo usado, orçamento, saldo e objetivo total.
- Mensagem acionável para orçamento/esquema inviável.
- Link `Escalador` adicionado à navegação principal.

## Testes automatizados

### Web — suíte completa e cobertura

Comando:

```bash
NODE_ENV=test npm run coverage -- --pool=threads --maxWorkers=1 --reporter=dot
```

Resultado:

- 33 arquivos de teste aprovados.
- 176 testes aprovados.
- Statements: **97,84%**.
- Branches: **90,28%**.
- Functions: **99,14%**.
- Lines: **98,96%**.

Há avisos preexistentes de `act(...)` em testes de `Comparar`, `DetalheJogador` e `App`; não houve falha.

### Web — lint

```bash
NODE_ENV=test npm run lint
```

Resultado: exit code 0, sem erros; dois avisos preexistentes em `AuthContext.tsx`.

### Web — build de produção

```bash
NODE_ENV=test npm run build
```

Resultado: TypeScript e Vite concluídos com sucesso; 63 módulos transformados.

### Backend — regressão completa

```bash
uv run pytest -q
uv run ruff check .
```

Resultado:

- **410 testes aprovados, 5 ignorados**.
- Ruff: `All checks passed!`.

## Integração real e validação humana

Serviços locais usados:

```bash
DATABASE_URL=postgresql+psycopg://cartola:cartola@127.0.0.1:5432/cartola \
  uv run uvicorn app.main:app --host 127.0.0.1 --port 8001

NODE_ENV=development VITE_API_BASE_URL=http://localhost:8001 \
  npm run dev -- --host 127.0.0.1 --port 5173
```

Passos executados:

1. Abrir `http://localhost:5173/escalador`.
2. Confirmar o carregamento dos seis esquemas via API.
3. Manter orçamento C$ 100, esquema 4-3-3 e modo Liga Clássica.
4. Clicar em `Montar escalação ótima`.
5. Confirmar 11 titulares + técnico, organizados por linha no campo tático.
6. Confirmar nomes reais, links de detalhe, preços e rótulo `Média básica`.
7. Confirmar resumo `C$ 98,97 de C$ 100,00 — C$ 1,03 sobrando` e objetivo total `71,74`.
8. Inspecionar console após a interação.

Resultado observado: fluxo ponta a ponta aprovado, com dados reais do backend e **zero erros no console**. Inspeção visual em desktop não encontrou overflow, desalinhamento ou problemas objetivos de legibilidade.

## Critérios de aceite

- [x] CA01 — 11 titulares + técnico organizados por posição.
- [x] CA02 — rótulos testados para Clássica, Tiro Curto e Patrimônio.
- [x] CA03 — `422` traduzido em orientação para aumentar orçamento ou trocar esquema.
- [x] CA04 — cards navegam para o detalhe do atleta.
