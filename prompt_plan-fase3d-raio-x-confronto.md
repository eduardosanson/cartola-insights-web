# Fase 3d — Raio-X de Confronto (web) — Implementation Plan

> **Para quem for executar (inclusive um modelo menor):** REQUIRED
> SUB-SKILL: `superpowers:subagent-driven-development` ou
> `superpowers:executing-plans`. **Pré-requisito:
> `backend/prompt_plan-fase3d-raio-x-confronto.md` já executado e
> mergeado** — o endpoint `GET /atletas/{id}/raio-x` precisa existir e
> responder de verdade antes desta metade fazer sentido.

**Goal:** Seção "Raio-X do confronto" em `DetalheJogador`, com os três
blocos (média no mando, o que o adversário cede, participação no time) e o
selo de veredito, consumindo o endpoint já pronto no backend.

**Spec:** `spec-fase3d-raio-x-confronto.md` — ler antes de começar.

---

### Task 1: Módulo `api/raioX.ts`

**Files:**
- Create: `src/api/raioX.ts`
- Create: `src/api/raioX.test.ts`

**Interfaces:**
- Produces: `type RaioXConfronto`, `type Veredito`,
  `buscarRaioXConfronto(id): Promise<RaioXConfronto>` — usado por
  [[Task 2]] e [[Task 3]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/api/raioX.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { buscarRaioXConfronto } from './raioX'

describe('api/raioX', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('busca GET /atletas/id/raio-x e retorna o corpo tipado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          atleta_id: 1,
          posicao: 'ATA',
          rodada: 24,
          mando: 'casa',
          clube_adversario_id: 267,
          clube_adversario_nome: 'Vasco',
          media_no_mando: 7.15,
          pontos_cedidos_adversario: 4.89,
          participacao_pontuacao_time_media: 12.4,
          veredito: 'referencia_do_time',
        }),
      }),
    )

    const resultado = await buscarRaioXConfronto(1)

    expect(resultado).toEqual({
      atleta_id: 1,
      posicao: 'ATA',
      rodada: 24,
      mando: 'casa',
      clube_adversario_id: 267,
      clube_adversario_nome: 'Vasco',
      media_no_mando: 7.15,
      pontos_cedidos_adversario: 4.89,
      participacao_pontuacao_time_media: 12.4,
      veredito: 'referencia_do_time',
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/atletas/1/raio-x',
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
        json: async () => ({ detail: 'raio-x nao disponivel para tecnico' }),
      }),
    )

    await expect(buscarRaioXConfronto(2)).rejects.toThrow('raio-x nao disponivel')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- raioX.test.ts`
Expected: FAIL — `Cannot find module './raioX'`

- [ ] **Step 3: Implementar**

Criar `src/api/raioX.ts`. Reusa o tipo `Mando` já existente em
`api/atletas.ts` (`'casa' | 'fora'`) em vez de redefinir o mesmo conceito
com outro nome:

```ts
import { apiGet } from './client'
import type { Mando } from './atletas'

export type Veredito = 'referencia_do_time' | 'contribuicao_dividida' | 'pontuacao_diluida'

export interface RaioXConfronto {
  atleta_id: number
  posicao: string
  rodada: number
  mando: Mando
  clube_adversario_id: number
  clube_adversario_nome: string
  media_no_mando: number
  pontos_cedidos_adversario: number | null
  participacao_pontuacao_time_media: number | null
  veredito: Veredito | null
}

export function buscarRaioXConfronto(id: number): Promise<RaioXConfronto> {
  return apiGet<RaioXConfronto>(`/atletas/${id}/raio-x`)
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- raioX.test.ts`
Expected: 2 passed

- [ ] **Step 5: Lint e commit**

Run: `npm run lint`

```bash
git add src/api/raioX.ts src/api/raioX.test.ts
git commit -m "feat: adiciona cliente api/raioX (GET /atletas/id/raio-x)"
```

---

### Task 2: Componente `RaioXConfronto`

**Files:**
- Create: `src/components/RaioXConfronto.tsx`
- Create: `src/components/RaioXConfronto.test.tsx`

**Interfaces:**
- Consumes: `RaioXConfronto`, `Veredito` de [[Task 1]].
- Produces: `RaioXConfronto({ raioX }): JSX.Element` — usado por
  [[Task 3]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/RaioXConfronto.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RaioXConfronto from './RaioXConfronto'
import type { RaioXConfronto as RaioXConfrontoTipo } from '../api/raioX'

const base: RaioXConfrontoTipo = {
  atleta_id: 1,
  posicao: 'ATA',
  rodada: 24,
  mando: 'casa',
  clube_adversario_id: 267,
  clube_adversario_nome: 'Vasco',
  media_no_mando: 7.15,
  pontos_cedidos_adversario: 4.89,
  participacao_pontuacao_time_media: 12.4,
  veredito: 'referencia_do_time',
}

describe('RaioXConfronto', () => {
  it('mostra os tres blocos e o selo de veredito quando tudo vem preenchido', () => {
    render(<RaioXConfronto raioX={base} />)

    expect(screen.getByText('Média em casa')).toBeInTheDocument()
    expect(screen.getByText('7,15')).toBeInTheDocument()
    expect(screen.getByText(/Vasco/)).toBeInTheDocument()
    expect(screen.getByText('4,89')).toBeInTheDocument()
    expect(screen.getByText('12,40%')).toBeInTheDocument()
    expect(screen.getByText('Referência do time')).toBeInTheDocument()
  })

  it('usa o rotulo "Media fora" quando mando e fora', () => {
    render(<RaioXConfronto raioX={{ ...base, mando: 'fora' }} />)

    expect(screen.getByText('Média fora')).toBeInTheDocument()
    expect(screen.queryByText('Média em casa')).not.toBeInTheDocument()
  })

  it('mostra texto de indisponibilidade so no bloco sem dado, sem esconder os outros', () => {
    render(<RaioXConfronto raioX={{ ...base, pontos_cedidos_adversario: null }} />)

    expect(screen.getByText(/sem dado suficiente/i)).toBeInTheDocument()
    expect(screen.getByText('7,15')).toBeInTheDocument() // bloco 1 continua
    expect(screen.getByText('Referência do time')).toBeInTheDocument() // selo continua
  })

  it('nao escolhe um rotulo de veredito quando veredito e null', () => {
    render(
      <RaioXConfronto
        raioX={{ ...base, participacao_pontuacao_time_media: null, veredito: null }}
      />,
    )

    expect(screen.queryByText('Referência do time')).not.toBeInTheDocument()
    expect(screen.queryByText('Contribuição dividida')).not.toBeInTheDocument()
    expect(screen.queryByText('Pontuação diluída')).not.toBeInTheDocument()
    expect(screen.getByText(/sem veredito/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- RaioXConfronto.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Criar `src/components/RaioXConfronto.tsx`:

```tsx
import type { RaioXConfronto as RaioXConfrontoTipo, Veredito } from '../api/raioX'
import { formatNumber } from '../utils/formatNumber'

const ROTULOS_VEREDITO: Record<Veredito, string> = {
  referencia_do_time: 'Referência do time',
  contribuicao_dividida: 'Contribuição dividida',
  pontuacao_diluida: 'Pontuação diluída',
}

interface Props {
  raioX: RaioXConfrontoTipo
}

export default function RaioXConfronto({ raioX }: Props) {
  const rotuloMedia = raioX.mando === 'casa' ? 'Média em casa' : 'Média fora'

  return (
    <section>
      <h3>Raio-X do confronto</h3>
      <dl>
        <dt>{rotuloMedia}</dt>
        <dd>{formatNumber(raioX.media_no_mando)}</dd>

        <dt>{raioX.clube_adversario_nome} cede em média</dt>
        <dd>
          {raioX.pontos_cedidos_adversario === null
            ? 'sem dado suficiente'
            : formatNumber(raioX.pontos_cedidos_adversario)}
        </dd>

        <dt>Participação na pontuação do time</dt>
        <dd>
          {raioX.participacao_pontuacao_time_media === null
            ? 'sem dado suficiente'
            : `${formatNumber(raioX.participacao_pontuacao_time_media)}%`}
        </dd>
      </dl>
      <p>
        {raioX.veredito === null
          ? 'Sem veredito ainda (dados insuficientes)'
          : ROTULOS_VEREDITO[raioX.veredito]}
      </p>
    </section>
  )
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- RaioXConfronto.test.tsx`
Expected: 4 passed

- [ ] **Step 5: Lint e commit**

Run: `npm run lint`

```bash
git add src/components/RaioXConfronto.tsx src/components/RaioXConfronto.test.tsx
git commit -m "feat: adiciona componente RaioXConfronto (3 blocos + selo de veredito)"
```

---

### Task 3: Integração em `DetalheJogador`

**Files:**
- Modify: `src/pages/DetalheJogador.tsx`
- Modify: `src/pages/DetalheJogador.test.tsx`

**Interfaces:**
- Consumes: `buscarRaioXConfronto` de [[Task 1]]; `RaioXConfronto` de
  [[Task 2]].

- [ ] **Step 1: Ler o arquivo atual e adicionar os testes que faltam**

Ler `src/pages/DetalheJogador.tsx` e `src/pages/DetalheJogador.test.tsx`
primeiro — a Fase 3b (radar de atributos) pode já ter integrado
`buscarPercentisAtleta`/`RadarAtributos` nesta mesma página antes desta
fase rodar; se sim, seguir exatamente o mesmo padrão já estabelecido lá
(dois `useState`/`useEffect` irmãos, um pra cada seção opcional) em vez de
reinventar. Em `src/pages/DetalheJogador.test.tsx`, adicionar:

```tsx
vi.mock('../api/raioX')
// ... no describe existente, importar `* as raioXApi from '../api/raioX'`

it('mostra o raio-x quando ele carrega com sucesso', async () => {
  vi.mocked(raioXApi.buscarRaioXConfronto).mockResolvedValue({
    atleta_id: 1, posicao: 'ATA', rodada: 24, mando: 'casa',
    clube_adversario_id: 267, clube_adversario_nome: 'Vasco',
    media_no_mando: 7.15, pontos_cedidos_adversario: 4.89,
    participacao_pontuacao_time_media: 12.4, veredito: 'referencia_do_time',
  })
  // ... renderizar a página como os outros testes já fazem
  expect(await screen.findByText('Raio-X do confronto')).toBeInTheDocument()
  expect(screen.getByText('Referência do time')).toBeInTheDocument()
})

it('mostra a mensagem de erro no lugar do raio-x quando o raio-x da 404', async () => {
  vi.mocked(raioXApi.buscarRaioXConfronto).mockRejectedValue(
    new Error('raio-x nao disponivel para tecnico'),
  )
  // ...
  expect(await screen.findByText(/raio-x nao disponivel/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- DetalheJogador.test.tsx`
Expected: FAIL — página ainda não chama `buscarRaioXConfronto`.

- [ ] **Step 3: Integrar em `DetalheJogador.tsx`**

Adicionar ao componente (junto do `useState`/`useEffect` já existentes,
sem reescrever a página inteira — só os trechos novos):

```tsx
import { buscarRaioXConfronto, type RaioXConfronto as RaioXConfrontoTipo } from '../api/raioX'
import RaioXConfronto from '../components/RaioXConfronto'

// dentro do componente:
const [raioX, setRaioX] = useState<RaioXConfrontoTipo | null>(null)
const [erroRaioX, setErroRaioX] = useState<string | null>(null)

useEffect(() => {
  if (!id) return
  buscarRaioXConfronto(Number(id))
    .then(setRaioX)
    .catch((err: Error) => setErroRaioX(err.message))
}, [id])

// no JSX, depois do <header> (e depois do radar, se a Fase 3b ja estiver integrada):
{raioX && <RaioXConfronto raioX={raioX} />}
{erroRaioX && <p>{erroRaioX}</p>}
```

> Erro de raio-X é um `<p>` normal, mesmo padrão do erro de percentis na
> Fase 3b — informativo ("este jogador não tem raio-X agora"), não bloqueia
> o resto da página.

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
git commit -m "feat: integra raio-x de confronto no detalhe do jogador"
```

---

### Task 4: Documentação, evidências e DOD

**Files:**
- Create: `docs/evidence/fase3d-raio-x-confronto.md`
- Modify: `spec-fase3d-raio-x-confronto.md`

**Nota sobre o roadmap:** não atualizado nesta fase — será atualizado
centralmente depois que 3c+3d, 3e e a Fase 5 estiverem todos prontos, pra
evitar conflito de edição simultânea no mesmo artefato HTML.

- [ ] **Step 1: Evidências e DOD**

Mesmo formato de `web/docs/evidence/contas.md`. Passo a passo manual:
abrir `/jogadores`, clicar num atacante com jogo agendado, confirmar que
"Raio-X do confronto" mostra os três blocos e um dos três rótulos de
veredito; abrir um técnico (ou um atleta cujo clube não tenha confronto
sincronizado), confirmar que aparece a mensagem de erro no lugar da seção,
sem quebrar o resto da página.

- [ ] **Step 2: Marcar DOD, commit**

```bash
git add docs/evidence/fase3d-raio-x-confronto.md spec-fase3d-raio-x-confronto.md
git commit -m "docs: evidencias e DOD do raio-x de confronto (Fase 3d web)"
```

- [ ] **Step 3: Push (se houver remote configurado)**

Run: `git push origin main` — só se `git remote -v` mostrar um remote
configurado; pular sem erro se não houver.
