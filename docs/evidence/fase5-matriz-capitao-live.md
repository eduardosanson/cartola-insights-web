# Evidências — Fase 5 (web): Matriz de Capitão & Live Radar

**Data:** 2026-08-25
**Rotas:** `/capitaes` e `/alertas`

## Entrega

- Cliente tipado para `GET /otimizador/matriz-capitao`, `GET /otimizador/substituto/{id}` e `GET /mercado/status-alterados?desde=`.
- `404` de substituto é convertido em ausência válida (`null`) e a UI mostra a orientação prevista no RF04.
- Matriz preserva a ordem recebida, destaca o primeiro colocado, hidrata nomes e reaproveita `RaioXConfronto`.
- Alertas consultam ao montar e quando a aba volta a ficar visível, sem `setInterval` nem polling em background.
- Substituto é buscado somente após ação explícita do usuário.
- Estados de carregamento, vazio, erro e fallback por ID foram cobertos.
- Links “Matriz de Capitão” e “Alertas” foram adicionados à navegação principal.

## Testes e qualidade

### Suíte completa e cobertura

```bash
NODE_ENV=test npm run coverage -- --pool=threads --maxWorkers=1 --reporter=dot
```

Resultado real:

```text
Test Files  36 passed (36)
Tests       192 passed (192)
Statements  97.94% (716/731)
Branches    90.75% (471/519)
Functions   99.23% (258/260)
Lines       99.23% (645/650)
```

A suíte mantém avisos preexistentes de `act(...)` em testes de `Comparar`, `DetalheJogador` e `App`. O novo teste de `visibilitychange` também pode registrar aviso de atualização assíncrona após o evento, sem falha funcional.

### Lint

```bash
NODE_ENV=test npm run lint
```

Resultado: exit code 0, sem erros; dois avisos preexistentes em `src/contexts/AuthContext.tsx`.

### Build

```bash
NODE_ENV=test npm run build
```

Resultado real:

```text
✓ 66 modules transformed
✓ built in 256ms
```

O Vite passou a avisar que o bundle principal ficou acima de 500 kB após minificação (506,73 kB). É um aviso de otimização futura, não erro de build.

## Contrato e integração real

O serviço padrão já ativo em `127.0.0.1:8000` ainda expunha uma imagem anterior e não continha os três endpoints. Para separar container desatualizado de ausência no código, o backend do worktree `Roadmap-2` foi iniciado em `127.0.0.1:8001` contra o PostgreSQL local.

Resultados reais:

- `GET /otimizador/matriz-capitao`: HTTP 200, 5 candidatos; primeiro `atleta_id=143193`, `capitao_score=17.445620776141595`.
- `GET /mercado/status-alterados?desde=1970-01-01T00:00:00Z`: HTTP 200, 534 registros no instante da validação.
- `GET /otimizador/substituto/143193`: HTTP 200; substituto `atleta_id=39148`, posição `ATA`, preço `13.02` e score `7.269026339463398`.

Os payloads reais correspondem às interfaces da web, inclusive `proximo_confronto`, reaproveitado diretamente por `RaioXConfronto`.

A inspeção visual automatizada no Chrome não pôde ser concluída porque a instância local exigiu aprovação manual de remote debugging. Nenhum resultado visual foi inventado; a validação automatizada de DOM e console fica pendente até essa aprovação.

## Passo a passo de validação humana

1. Subir o backend atualizado e iniciar a web com `VITE_API_BASE_URL` apontando para ele.
2. Abrir `/capitaes` e confirmar cinco cards na mesma ordem da resposta da API.
3. Confirmar o selo “1º lugar” apenas no primeiro card e o raio-X do próximo confronto em todos os candidatos.
4. Abrir `/alertas` e confirmar o estado vazio quando não houver alteração posterior à montagem.
5. Com uma alteração de status disponível, confirmar nome/ID, rótulo de status e botão “Ver substituto sugerido”.
6. Verificar no painel Network que `/otimizador/substituto/{id}` só é chamado depois do clique.
7. Simular `404` de substituto e confirmar “Nenhum substituto direto encontrado nessa faixa de preço”.
8. Trocar de aba e voltar; confirmar uma nova chamada a `status-alterados` com `desde` atualizado e ausência de polling contínuo.
9. Em viewport mobile, confirmar que navegação e cards quebram linha sem overflow horizontal.

## Critérios de aceite

- [x] CA01 — Top 5 renderizado na ordem retornada, sem ordenação no cliente.
- [x] CA02 — `visibilitychange` visível dispara nova checagem com `desde` atualizado.
- [x] CA03 — substituto consultado somente após o clique.
- [x] CA04 — `404` convertido na mensagem de ausência prevista.
