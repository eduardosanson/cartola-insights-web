# Fase 3e — Perfil de Risco (web) — Implementation Plan

> **Para quem for executar (inclusive um modelo menor):** REQUIRED
> SUB-SKILL: `superpowers:subagent-driven-development` ou
> `superpowers:executing-plans`. **Pré-requisito: `backend/prompt_plan-fase3e-perfil-risco.md`
> já executado e mergeado** — o endpoint `GET /atletas/{id}/perfil-risco`
> precisa existir e responder de verdade. Fase independente das demais
> sub-fases de Visualização Avançada (3a-3d) — não depende de nenhum
> componente delas (ex.: não depende de `RadarAtributos`, se a Fase 3b já
> estiver mergeada, ou não, tanto faz).

**Goal:** Selo de risco (baixo/médio/alto) em `DetalheJogador`, consumindo
o endpoint de perfil de risco já pronto no backend.

**Spec:** `../specs/spec-fase3e-perfil-risco.md` — ler antes de começar.

---

### Task 1: Módulo `api/perfilRisco.ts`

**Files:**
- Create: `src/api/perfilRisco.ts`
- Create: `src/api/perfilRisco.test.ts`

**Interfaces:**
- Produces: `type PerfilRisco`, `type ClassificacaoRisco`,
  `buscarPerfilRiscoAtleta(id): Promise<PerfilRisco>` — usado por
  [[Task 2]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/api/perfilRisco.test.ts`, mesmo padrão de
`src/api/atletas.test.ts` (mock de `fetch` global via `vi.stubGlobal`):

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { buscarPerfilRiscoAtleta } from './perfilRisco'

describe('api/perfilRisco', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('busca GET /atletas/id/perfil-risco e retorna o corpo tipado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          atleta_id: 1,
          risco_percentual: 70.0,
          classificacao: 'alto',
          pontos_retorno_direto: 132.0,
          pontos_participacao: 56.5,
        }),
      }),
    )

    const resultado = await buscarPerfilRiscoAtleta(1)

    expect(resultado).toEqual({
      atleta_id: 1,
      risco_percentual: 70.0,
      classificacao: 'alto',
      pontos_retorno_direto: 132.0,
      pontos_participacao: 56.5,
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/atletas/1/perfil-risco',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('propaga o erro (incluindo 404) como Error com a mensagem do backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          detail: 'dados insuficientes - atleta com poucos jogos pra calcular perfil de risco',
        }),
      }),
    )

    await expect(buscarPerfilRiscoAtleta(2)).rejects.toThrow('dados insuficientes')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- perfilRisco.test.ts`
Expected: FAIL — `Cannot find module './perfilRisco'`

- [ ] **Step 3: Implementar**

Criar `src/api/perfilRisco.ts`:

```ts
import { apiGet } from './client'

export type ClassificacaoRisco = 'baixo' | 'medio' | 'alto'

export interface PerfilRisco {
  atleta_id: number
  risco_percentual: number
  classificacao: ClassificacaoRisco
  pontos_retorno_direto: number
  pontos_participacao: number
}

export function buscarPerfilRiscoAtleta(id: number): Promise<PerfilRisco> {
  return apiGet<PerfilRisco>(`/atletas/${id}/perfil-risco`)
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- perfilRisco.test.ts`
Expected: 2 passed

- [ ] **Step 5: Lint e commit**

Run: `npm run lint`

```bash
git add src/api/perfilRisco.ts src/api/perfilRisco.test.ts
git commit -m "feat: adiciona cliente api/perfilRisco (GET /atletas/id/perfil-risco)"
```

---

### Task 2: Componente `SeloRisco`

**Files:**
- Create: `src/components/SeloRisco.tsx`
- Create: `src/components/SeloRisco.test.tsx`

**Interfaces:**
- Consumes: `PerfilRisco`, `ClassificacaoRisco` de [[Task 1]].
- Produces: `SeloRisco({ perfil }): JSX.Element` — usado por [[Task 3]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/SeloRisco.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SeloRisco from './SeloRisco'
import type { PerfilRisco } from '../api/perfilRisco'

const base: PerfilRisco = {
  atleta_id: 1,
  risco_percentual: 70,
  classificacao: 'alto',
  pontos_retorno_direto: 132,
  pontos_participacao: 56.5,
}

describe('SeloRisco', () => {
  it('mostra "Risco alto" na cor --danger quando classificacao é alto', () => {
    render(<SeloRisco perfil={base} />)

    const selo = screen.getByText(/risco alto/i)
    expect(selo).toBeInTheDocument()
    expect(selo).toHaveStyle({ color: 'var(--danger)' })
  })

  it('mostra "Risco médio" na cor --accent-away quando classificacao é medio', () => {
    render(<SeloRisco perfil={{ ...base, classificacao: 'medio', risco_percentual: 50 }} />)

    const selo = screen.getByText(/risco médio/i)
    expect(selo).toHaveStyle({ color: 'var(--accent-away)' })
  })

  it('mostra "Risco baixo" na cor --accent-home quando classificacao é baixo', () => {
    render(<SeloRisco perfil={{ ...base, classificacao: 'baixo', risco_percentual: 0 }} />)

    const selo = screen.getByText(/risco baixo/i)
    expect(selo).toHaveStyle({ color: 'var(--accent-home)' })
  })

  it('mostra o percentual formatado com vírgula decimal (pt-BR)', () => {
    render(<SeloRisco perfil={{ ...base, risco_percentual: 70.5 }} />)

    expect(screen.getByText(/70,5%/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- SeloRisco.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Criar `src/components/SeloRisco.tsx`. **Mesmo padrão de
`MandoRodada.tsx`** — dicionário `presentation` por chave discreta, sem
lógica condicional numérica no componente (RF02 do spec: os limiares já
foram resolvidos pelo backend, o cliente só traduz `classificacao` →
rótulo/cor):

```tsx
import type { PerfilRisco } from '../api/perfilRisco'
import { formatNumber } from '../utils/formatNumber'

const presentation = {
  baixo: { label: 'Risco baixo', color: 'var(--accent-home)' },
  medio: { label: 'Risco médio', color: 'var(--accent-away)' },
  alto: { label: 'Risco alto', color: 'var(--danger)' },
}

interface Props {
  perfil: PerfilRisco
}

export default function SeloRisco({ perfil }: Props) {
  const current = presentation[perfil.classificacao]

  return (
    <span style={{ color: current.color }}>
      {current.label} ({formatNumber(perfil.risco_percentual)}%)
    </span>
  )
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- SeloRisco.test.tsx`
Expected: 4 passed

- [ ] **Step 5: Lint e commit**

Run: `npm run lint`

```bash
git add src/components/SeloRisco.tsx src/components/SeloRisco.test.tsx
git commit -m "feat: adiciona componente SeloRisco (badge baixo/medio/alto)"
```

---

### Task 3: Integração em `DetalheJogador`

**Files:**
- Modify: `src/pages/DetalheJogador.tsx`
- Modify: `src/pages/DetalheJogador.test.tsx`

**Interfaces:**
- Consumes: `buscarPerfilRiscoAtleta` de [[Task 1]]; `SeloRisco` de
  [[Task 2]].

- [ ] **Step 1: Adicionar os testes que faltam**

Em `src/pages/DetalheJogador.test.tsx`, seguir o padrão real já usado no
arquivo (`vi.spyOn` no módulo importado como namespace, não `vi.mock`).
Adicionar o import e os casos nesta ordem, ao lado dos existentes:

```tsx
import * as perfilRiscoApi from '../api/perfilRisco'

const perfilRisco = {
  atleta_id: 1,
  risco_percentual: 70,
  classificacao: 'alto' as const,
  pontos_retorno_direto: 132,
  pontos_participacao: 56.5,
}
```

```tsx
it('mostra o selo de risco quando o perfil carrega com sucesso', async () => {
  vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
  vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])
  vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRisco)

  renderDetalhe('1', null)

  expect(await screen.findByText(/risco alto/i)).toBeInTheDocument()
})

it('mostra a mensagem de erro no lugar do selo quando o perfil de risco da 404', async () => {
  vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
  vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])
  vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockRejectedValue(
    new Error('dados insuficientes - atleta com poucos jogos pra calcular perfil de risco'),
  )

  renderDetalhe('1', null)

  expect(await screen.findByText(/dados insuficientes/i)).toBeInTheDocument()
})
```

> Os testes existentes que **não** fazem `vi.spyOn` de `perfilRiscoApi`
> (ex.: `'loads atleta and histórico...'`) vão deixar a chamada real
> `buscarPerfilRiscoAtleta` sem mock — como ela usa `fetch` de verdade
> (não interceptado), vai rejeitar com erro de rede no ambiente de teste.
> Isso é seguro pro RF03 (erro não quebra a página), mas polui esses
> testes com uma promise rejeitada não observada. Adicionar
> `vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRisco)`
> no topo de cada teste existente que já teria motivo pra isso, ou um
> `beforeEach` único no topo do `describe` com esse mock, sobrescrito nos
> dois testes novos que precisam de outro comportamento — decisão de
> quem implementar, ambas as formas resolvem o mesmo problema.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- DetalheJogador.test.tsx`
Expected: FAIL — página ainda não chama `buscarPerfilRiscoAtleta`.

- [ ] **Step 3: Integrar em `DetalheJogador.tsx`**

Adicionar ao componente (junto do `useState`/`useEffect` já existentes,
sem reescrever a página inteira):

```tsx
import { buscarPerfilRiscoAtleta, type PerfilRisco } from '../api/perfilRisco'
import SeloRisco from '../components/SeloRisco'

// dentro do componente:
const [perfilRisco, setPerfilRisco] = useState<PerfilRisco | null>(null)
const [erroPerfilRisco, setErroPerfilRisco] = useState<string | null>(null)

useEffect(() => {
  if (!id) return
  buscarPerfilRiscoAtleta(Number(id))
    .then(setPerfilRisco)
    .catch((err: Error) => setErroPerfilRisco(err.message))
}, [id])

// no JSX, dentro do <header>, depois do <MandoRodada ... />:
{perfilRisco && <p><SeloRisco perfil={perfilRisco} /></p>}
{erroPerfilRisco && <p>{erroPerfilRisco}</p>}
```

> Mesma decisão de `role` já tomada na Fase 3b/web pro erro de percentis:
> não é `role="alert"` (não é falha de ação do usuário, é "este atleta não
> tem perfil de risco calculado ainda"), informativo, não bloqueia o resto
> da página.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- DetalheJogador.test.tsx`
Expected: todos os testes (existentes + novos) passam.

- [ ] **Step 5: Suíte inteira, build, lint, cobertura, commit**

Run: `npm test`
Run: `npm run build`
Run: `npm run lint`
Run: `npm run coverage`

```bash
git add src/pages/DetalheJogador.tsx src/pages/DetalheJogador.test.tsx
git commit -m "feat: integra selo de risco no detalhe do jogador"
```

---

### Task 4: Documentação, evidências e DOD

**Files:**
- Create: `docs/evidence/fase3e-perfil-risco.md`
- Modify: `../specs/spec-fase3e-perfil-risco.md`

- [ ] **Step 1: Suíte final**

Run: `npm test`
Run: `npm run build`
Run: `npm run lint`
Run: `npm run coverage`

- [ ] **Step 2: Evidências**

Mesmo formato de `web/docs/evidence/contas.md` (referência de formato já
usada no projeto). Passo a passo manual: abrir `/jogadores`, clicar num
atacante artilheiro (ex.: alguém com bastante gol na temporada), confirmar
que o selo mostra "Risco alto" em vermelho; abrir um lateral/zagueiro com
pouco gol e bastante desarme, confirmar "Risco baixo" em verde; abrir um
atleta com poucos jogos (ou um técnico), confirmar que aparece a mensagem
de erro no lugar do selo, sem quebrar a página.

- [ ] **Step 3: DOD, commit**

```bash
git add docs/evidence/fase3e-perfil-risco.md ../specs/spec-fase3e-perfil-risco.md
git commit -m "docs: evidencias e DOD do perfil de risco (Fase 3e web)"
```

> **Não mexer no roadmap** — combinado explicitamente pro planejamento
> desta fase: o roadmap só é atualizado centralmente depois que 3c+3d, 3e
> e Fase 5 estiverem todos prontos.
