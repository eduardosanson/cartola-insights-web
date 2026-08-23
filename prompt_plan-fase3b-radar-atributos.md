# Fase 3b — Radar de Atributos (web) — Implementation Plan

> **Para quem for executar (inclusive um modelo menor):** REQUIRED
> SUB-SKILL: `superpowers:subagent-driven-development` ou
> `superpowers:executing-plans`. **Pré-requisito: `backend/prompt_plan-fase3b-radar-atributos.md`
> já executado e mergeado** — o endpoint `GET /atletas/{id}/percentis`
> precisa existir e responder de verdade antes desta metade fazer sentido.

**Goal:** Componente de radar SVG (4 eixos) em `DetalheJogador`, consumindo
o endpoint de percentis já pronto no backend.

**Spec:** `spec-fase3b-radar-atributos.md` — a matemática do radar (seção
"Matemática do radar") já está derivada e conferida lá, copiar como está.

---

### Task 1: Módulo `api/percentis.ts`

**Files:**
- Create: `src/api/percentis.ts`
- Create: `src/api/percentis.test.ts`

**Interfaces:**
- Produces: `type PercentisAtleta` (union), `buscarPercentisAtleta(id):
  Promise<PercentisAtleta>` — usado por [[Task 2]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/api/percentis.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { buscarPercentisAtleta } from './percentis'

describe('api/percentis', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('busca GET /atletas/id/percentis e retorna o corpo tipado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          atleta_id: 1,
          pontuacao_media: 80,
          participacao_gol: 91,
          desarme: 40,
          disciplina: 65,
        }),
      }),
    )

    const resultado = await buscarPercentisAtleta(1)

    expect(resultado).toEqual({
      atleta_id: 1,
      pontuacao_media: 80,
      participacao_gol: 91,
      desarme: 40,
      disciplina: 65,
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/atletas/1/percentis',
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
        json: async () => ({ detail: 'dados insuficientes — atleta com poucos jogos' }),
      }),
    )

    await expect(buscarPercentisAtleta(2)).rejects.toThrow('dados insuficientes')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- percentis.test.ts`
Expected: FAIL — `Cannot find module './percentis'`

- [ ] **Step 3: Implementar**

Criar `src/api/percentis.ts`:

```ts
import { apiGet } from './client'

export interface PercentisPadrao {
  atleta_id: number
  pontuacao_media: number
  participacao_gol: number
  desarme: number
  disciplina: number
}

export interface PercentisGol {
  atleta_id: number
  pontuacao_media: number
  defesas: number
  solidez_sg: number
  disciplina: number
}

export type PercentisAtleta = PercentisPadrao | PercentisGol

export function buscarPercentisAtleta(id: number): Promise<PercentisAtleta> {
  return apiGet<PercentisAtleta>(`/atletas/${id}/percentis`)
}

export function ehPercentisGol(percentis: PercentisAtleta): percentis is PercentisGol {
  return 'defesas' in percentis
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- percentis.test.ts`
Expected: 2 passed

- [ ] **Step 5: Lint e commit**

Run: `npm run lint`

```bash
git add src/api/percentis.ts src/api/percentis.test.ts
git commit -m "feat: adiciona cliente api/percentis (GET /atletas/id/percentis)"
```

---

### Task 2: Componente `RadarAtributos`

**Files:**
- Create: `src/components/RadarAtributos.tsx`
- Create: `src/components/RadarAtributos.test.tsx`

**Interfaces:**
- Consumes: `PercentisAtleta`, `ehPercentisGol` de [[Task 1]].
- Produces: `RadarAtributos({ percentis }): JSX.Element` — usado por
  [[Task 3]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/RadarAtributos.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RadarAtributos from './RadarAtributos'
import type { PercentisPadrao, PercentisGol } from '../api/percentis'

const percentisPadrao: PercentisPadrao = {
  atleta_id: 1, pontuacao_media: 80, participacao_gol: 91, desarme: 40, disciplina: 65,
}
const percentisGol: PercentisGol = {
  atleta_id: 2, pontuacao_media: 70, defesas: 88, solidez_sg: 95, disciplina: 50,
}

describe('RadarAtributos', () => {
  it('mostra os 4 rotulos certos pra ZAG/LAT/MEI/ATA', () => {
    render(<RadarAtributos percentis={percentisPadrao} />)
    expect(screen.getByText('Pontuação média')).toBeInTheDocument()
    expect(screen.getByText('Participação em gol')).toBeInTheDocument()
    expect(screen.getByText('Desarme')).toBeInTheDocument()
    expect(screen.getByText('Disciplina')).toBeInTheDocument()
  })

  it('mostra os rotulos certos pra GOL (Defesas/Solidez), nao Participacao/Desarme', () => {
    render(<RadarAtributos percentis={percentisGol} />)
    expect(screen.getByText('Defesas')).toBeInTheDocument()
    expect(screen.getByText('Solidez (SG)')).toBeInTheDocument()
    expect(screen.queryByText('Participação em gol')).not.toBeInTheDocument()
  })

  it('com todos os percentis em 100, o poligono toca o raio maximo nos 4 eixos', () => {
    const todosCem: PercentisPadrao = {
      atleta_id: 3, pontuacao_media: 100, participacao_gol: 100, desarme: 100, disciplina: 100,
    }
    render(<RadarAtributos percentis={todosCem} raio={100} centroX={150} centroY={150} />)
    const poligono = screen.getByTestId('radar-poligono')
    const pontos = poligono.getAttribute('points')!.trim().split(/\s+/)
    // eixo 0 (topo): (150, 150-100) = (150,50)
    expect(pontos[0]).toBe('150,50')
    // eixo 1 (direita): (150+100, 150) = (250,150)
    expect(pontos[1]).toBe('250,150')
    // eixo 2 (baixo): (150, 150+100) = (150,250)
    expect(pontos[2]).toBe('150,250')
    // eixo 3 (esquerda): (150-100, 150) = (50,150)
    expect(pontos[3]).toBe('50,150')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- RadarAtributos.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Criar `src/components/RadarAtributos.tsx`. **A matemática abaixo é a mesma
derivada em `spec-fase3b-radar-atributos.md` — copiar como está:**

```tsx
import { ehPercentisGol, type PercentisAtleta } from '../api/percentis'

interface Props {
  percentis: PercentisAtleta
  raio?: number
  centroX?: number
  centroY?: number
}

function pontoEixo(indice: number, total: number, valor: number, cx: number, cy: number, r: number) {
  const angulo = -Math.PI / 2 + indice * ((2 * Math.PI) / total)
  const raioEfetivo = r * (valor / 100)
  const x = cx + raioEfetivo * Math.cos(angulo)
  const y = cy + raioEfetivo * Math.sin(angulo)
  // Arredonda pra número inteiro só na formatação do atributo `points` —
  // evita ponto flutuante tipo "150.00000000001" no snapshot/teste.
  return `${Math.round(x)},${Math.round(y)}`
}

export default function RadarAtributos({ percentis, raio = 100, centroX = 150, centroY = 150 }: Props) {
  const eixos = ehPercentisGol(percentis)
    ? [
        { rotulo: 'Pontuação média', valor: percentis.pontuacao_media },
        { rotulo: 'Defesas', valor: percentis.defesas },
        { rotulo: 'Solidez (SG)', valor: percentis.solidez_sg },
        { rotulo: 'Disciplina', valor: percentis.disciplina },
      ]
    : [
        { rotulo: 'Pontuação média', valor: percentis.pontuacao_media },
        { rotulo: 'Participação em gol', valor: percentis.participacao_gol },
        { rotulo: 'Desarme', valor: percentis.desarme },
        { rotulo: 'Disciplina', valor: percentis.disciplina },
      ]

  const pontos = eixos
    .map((eixo, indice) => pontoEixo(indice, eixos.length, eixo.valor, centroX, centroY, raio))
    .join(' ')

  const raioAnel = `${centroX - raio},${centroY} ${centroX},${centroY - raio} ${centroX + raio},${centroY} ${centroX},${centroY + raio}`

  return (
    <div>
      <svg viewBox={`0 0 ${centroX * 2} ${centroY * 2}`} role="img" aria-label="Radar de atributos">
        <polygon points={raioAnel} fill="none" stroke="var(--border)" />
        <polygon
          data-testid="radar-poligono"
          points={pontos}
          fill="var(--accent-home)"
          fillOpacity={0.35}
          stroke="var(--accent-home)"
        />
      </svg>
      <dl>
        {eixos.map((eixo) => (
          <div key={eixo.rotulo}>
            <dt>{eixo.rotulo}</dt>
            <dd>{eixo.valor.toFixed(0)}º percentil</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- RadarAtributos.test.tsx`
Expected: 3 passed

- [ ] **Step 5: Lint e commit**

Run: `npm run lint`

```bash
git add src/components/RadarAtributos.tsx src/components/RadarAtributos.test.tsx
git commit -m "feat: adiciona componente RadarAtributos (radar SVG de 4 eixos)"
```

---

### Task 3: Integração em `DetalheJogador`

**Files:**
- Modify: `src/pages/DetalheJogador.tsx`
- Modify: `src/pages/DetalheJogador.test.tsx`

**Interfaces:**
- Consumes: `buscarPercentisAtleta` de [[Task 1]]; `RadarAtributos` de
  [[Task 2]].

- [ ] **Step 1: Atualizar/adicionar os testes que faltam**

Em `src/pages/DetalheJogador.test.tsx` (ler o arquivo atual primeiro —
segue o mesmo padrão de mock de `api/atletas` já usado nos testes
existentes da página), adicionar:

```tsx
vi.mock('../api/percentis')
// ... no describe existente:

it('mostra o radar quando os percentis carregam com sucesso', async () => {
  vi.mocked(percentisApi.buscarPercentisAtleta).mockResolvedValue({
    atleta_id: 1, pontuacao_media: 80, participacao_gol: 91, desarme: 40, disciplina: 65,
  })
  // ... renderizar a página como os outros testes já fazem
  expect(await screen.findByText('Participação em gol')).toBeInTheDocument()
})

it('mostra a mensagem de erro no lugar do radar quando o percentil da 404', async () => {
  vi.mocked(percentisApi.buscarPercentisAtleta).mockRejectedValue(
    new Error('dados insuficientes — atleta com poucos jogos'),
  )
  // ...
  expect(await screen.findByText(/dados insuficientes/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- DetalheJogador.test.tsx`
Expected: FAIL — página ainda não chama `buscarPercentisAtleta`.

- [ ] **Step 3: Integrar em `DetalheJogador.tsx`**

Adicionar ao componente (junto do `useState`/`useEffect` já existentes,
sem reescrever a página inteira — só os trechos novos):

```tsx
import { buscarPercentisAtleta, type PercentisAtleta } from '../api/percentis'
import RadarAtributos from '../components/RadarAtributos'

// dentro do componente:
const [percentis, setPercentis] = useState<PercentisAtleta | null>(null)
const [erroPercentis, setErroPercentis] = useState<string | null>(null)

useEffect(() => {
  if (!id) return
  buscarPercentisAtleta(Number(id))
    .then(setPercentis)
    .catch((err: Error) => setErroPercentis(err.message))
}, [id])

// no JSX, depois do <header>:
{percentis && <RadarAtributos percentis={percentis} />}
{erroPercentis && <p>{erroPercentis}</p>}
```

> Erro de percentis é um `<p>` normal, não `role="alert"` — não é uma falha
> da ação do usuário (como um formulário), é só "este atleta não tem
> radar", informativo. Não bloqueia o resto da página (histórico continua
> aparecendo normalmente).

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
git commit -m "feat: integra radar de atributos no detalhe do jogador"
```

---

### Task 4: Documentação, evidências, DOD e roadmap

**Files:**
- Create: `docs/evidence/fase3b-radar-atributos.md`
- Modify: `spec-fase3b-radar-atributos.md`
- (fora deste repositório) Atualizar o artefato "Roadmap Cartola Insights"

- [ ] **Step 1: Evidências e DOD**

Mesmo formato de `web/docs/evidence/contas.md` (referência de formato já
usada no projeto). Passo a passo manual: abrir `/jogadores`, clicar num
atacante com bastante gol na temporada, confirmar que o radar mostra
"Participação em gol" alto; abrir um goleiro, confirmar "Defesas"/"Solidez
(SG)" em vez de "Participação em gol"/"Desarme"; abrir um atleta com poucos
jogos (ou um técnico, se a listagem mostrar técnico), confirmar que aparece
a mensagem de erro no lugar do radar, sem quebrar a página.

- [ ] **Step 2: Marcar DOD, commit**

```bash
git add docs/evidence/fase3b-radar-atributos.md spec-fase3b-radar-atributos.md
git commit -m "docs: evidencias e DOD do radar de atributos (Fase 3b web)"
```

- [ ] **Step 3: Atualizar o roadmap**

**Esta é a etapa que fecha tanto a Fase 3a quanto a 3b no roadmap** — as
duas só fazem sentido visualmente juntas (3a é só cálculo, sem UI pra
mostrar). Ler `backend/docs/decisions/fase3a-percentis-posicao.md`, seção
"Atualização do roadmap", pra saber exatamente o que muda (não é troca
mecânica de 3 blocos como a Fase 4b — o SVG de exemplo do radar precisa
ser redesenhado de 6 pra 4 eixos, usando a mesma matemática desta task).
Buscar a URL do artefato (`Artifact({action: "list"})`), ler o conteúdo
atual, aplicar as mudanças, publicar, reler pra conferir.
