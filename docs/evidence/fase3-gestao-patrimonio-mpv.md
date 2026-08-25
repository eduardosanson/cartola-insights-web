# Evidências — Fase 3 (Novo Ciclo, web): Gestão de Patrimônio & MPV

Data: 2026-08-25

## Entrega

- Cliente tipado para `GET /atletas/{id}/mpv` e `GET /mercado/curva-valorizacao`.
- MPV exibido no detalhe do atleta com o aviso permanente de que é uma estimativa histórica.
- Estados `confiavel: false`, `mpv_estimado: null` e 404 por falta de preço/faixas são exibidos como dados insuficientes, sem `null`/`NaN`.
- Simulador client-side de 0 a 20 pontos; a interação não repete a chamada de rede.
- Curva SVG responsiva com destaque explícito das rodadas 1 a 5.
- Página pública `/patrimonio`, usando o `AtletaAutocomplete` existente para simulação avulsa.
- Rotas e navegação de `/comparar` e `/patrimonio` integradas no app.

## Testes e qualidade

Comando:

```bash
NODE_ENV=test npm test -- --pool=threads --maxWorkers=1 --reporter=dot
```

Resultado real:

```text
Test Files  30 passed (30)
Tests       165 passed (165)
Duration    33.34s
```

A execução paralela padrão chegou a sofrer timeout na criação de workers enquanto lint e build rodavam em paralelo; a repetição isolada com um worker passou integralmente. Não houve falha funcional.

Cobertura:

```bash
NODE_ENV=test npm run coverage -- --pool=threads --maxWorkers=1 --reporter=dot
```

```text
All files: statements 97.95% | branches 91.21% | functions 99.51% | lines 99.22%
Test Files 30 passed (30)
Tests      165 passed (165)
```

Lint:

```bash
NODE_ENV=test npm run lint
```

```text
0 errors; 2 warnings preexistentes em src/contexts/AuthContext.tsx
```

Build:

```bash
NODE_ENV=test npm run build
```

```text
✓ 60 modules transformed
✓ built in 529ms
```

## Contrato real do backend

A integração foi conferida contra a implementação e os testes do worktree backend `Roadmap-2`:

- `GET /atletas/{id}/mpv` retorna os cinco campos usados pela UI: `mpv_estimado`, `faixa_preco`, `coeficientes`, `amostras`, `confiavel`.
- O backend também pode retornar 404 quando o atleta existe mas ainda não tem preço histórico ou quando as faixas ainda não foram calculadas. A UI mapeia esses estados para “Dados insuficientes ainda para estimar”.
- `GET /mercado/curva-valorizacao` retorna diretamente a lista `{rodada, variacao_media}[]`; lista vazia é um sucesso válido.
- No banco local atual não existe `PrecoHistorico`, portanto a validação real do backend produz 404 informativo para MPV e `[]` para curva. A limitação está documentada na evidência backend; a UI cobre ambos os estados sem inventar dados.

## Passo a passo de validação humana

1. Subir a API do worktree backend `Roadmap-2` e o web com `npm run dev`.
2. Abrir um atleta em `/jogadores/{id}`.
3. Confirmar o bloco “MPV estimado”: com base confiável, deve mostrar C$ e o selo “estimativa baseada em dados históricos”; sem base, deve mostrar dados insuficientes.
4. Abrir `/patrimonio` pelo menu.
5. Confirmar a curva de transição e a nota sobre as rodadas 1 a 5; quando a API retorna `[]`, confirmar o estado vazio explícito.
6. Buscar um atleta no autocomplete e selecioná-lo.
7. Mover o slider de 0 a 20; confirmar atualização instantânea em C$ e ausência de novas requests no painel Network.
8. Em viewport mobile, confirmar que o SVG mantém proporção e não cria scroll horizontal.

## Limitação de escopo registrada

O projeto ainda não possui API/modelo de “elenco salvo” na web. A entrega implementa o caminho exigido pelo próprio RF06 para quando não há elenco: curva geral + simulador avulso reutilizando `AtletaAutocomplete`. Nenhum endpoint ou persistência inexistente foi inventado.
