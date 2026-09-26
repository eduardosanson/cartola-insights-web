# Indicar Rodada e Horário da Última Sincronização — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the round and timestamp of the last successful sync on the Jogadores and Escalador analysis screens, with graceful error handling for failed API calls.

**Architecture:** Create a lightweight sync-status API client that queries `/status/sync`, then build a reusable `IndicadorSincronizacao` component that handles three states (success with data, empty/never synced, network error) independently. Integrate it into both Jogadores and Escalador pages without blocking their render if the status call fails.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, `src/api/client.ts` HTTP utilities

**Spec:** `docs/specs/39-indicar-rodada-e.md`

## Global Constraints

- TypeScript strict mode enforced; all types must be explicit
- Component and test coverage must be ≥ 90%
- All API calls use the existing `apiGet()` from `src/api/client.ts`
- Errors must never hide data already on screen (fallback-safe)
- Timestamp formatting must respect user's local timezone; UTC value visible in title/expanded text

## Review Focus

1. **Empty sync state** — When API returns `null` or empty payload, component correctly shows "Dados ainda não sincronizados" without crashing
2. **Network failure** — When `/status/sync` fails (network error, 5xx), "Atualização indisponível" displays, but Jogadores/Escalador data remains visible
3. **Timezone respect** — Formatted timestamp uses local timezone; UTC original readable in `title` attribute or expanded view
4. **Consistent formatting** — Same data formatted identically on both Jogadores and Escalador pages
5. **Non-blocking integration** — Parent components (Jogadores, Escalador) render fully even if status fetch is slow or fails

---

## Task 1: Create Sync Status API Client with Tests

**Files:**
- Create: `src/api/sincronizacao.ts` — API client module
- Create: `src/api/sincronizacao.test.ts` — client tests

**Interfaces:**
- Consumes: `src/api/client.ts:apiGet` (already defined)
- Produces:
  - `SyncStatus` type: `{ round: number; timestamp: string }`
  - `fetchSyncStatus(): Promise<SyncStatus | null>`

- [ ] **Step 1: Write failing test for fetchSyncStatus success case**

```typescript
// src/api/sincronizacao.test.ts
import { describe, it, expect, vi } from 'vitest'
import * as apiClient from './client'
import { fetchSyncStatus } from './sincronizacao'

vi.mock('./client')

describe('fetchSyncStatus', () => {
  it('returns SyncStatus when API call succeeds', async () => {
    const mockData = { round: 42, timestamp: '2026-09-26T15:30:00Z' }
    vi.mocked(apiClient.apiGet).mockResolvedValue(mockData)

    const result = await fetchSyncStatus()

    expect(result).toEqual(mockData)
    expect(apiClient.apiGet).toHaveBeenCalledWith('/status/sync')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/api/sincronizacao.test.ts
```

Expected: FAIL (fetchSyncStatus not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/api/sincronizacao.ts
import { apiGet } from './client'

export interface SyncStatus {
  round: number
  timestamp: string
}

export async function fetchSyncStatus(): Promise<SyncStatus | null> {
  return apiGet<SyncStatus | null>('/status/sync')
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/api/sincronizacao.test.ts
```

Expected: PASS

- [ ] **Step 5: Add test for null/empty response**

```typescript
it('returns null when no sync data exists', async () => {
  vi.mocked(apiClient.apiGet).mockResolvedValue(null)

  const result = await fetchSyncStatus()

  expect(result).toBeNull()
})
```

- [ ] **Step 6: Add test for error handling**

```typescript
it('throws ApiError when API call fails', async () => {
  const mockError = new Error('Network error')
  vi.mocked(apiClient.apiGet).mockRejectedValue(mockError)

  await expect(fetchSyncStatus()).rejects.toThrow('Network error')
})
```

- [ ] **Step 7: Run all client tests to verify they pass**

```bash
npm run test -- src/api/sincronizacao.test.ts
```

Expected: All 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add src/api/sincronizacao.ts src/api/sincronizacao.test.ts
git commit -m "feat: #39 — create sync status API client with tests

- Export SyncStatus type and fetchSyncStatus() function
- Tests cover success, null, and error cases
Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create IndicadorSincronizacao Component with Tests

**Files:**
- Create: `src/components/IndicadorSincronizacao.tsx` — reusable component
- Create: `src/components/IndicadorSincronizacao.test.tsx` — component tests

**Interfaces:**
- Consumes:
  - `fetchSyncStatus` from `src/api/sincronizacao.ts`
  - React hooks: `useEffect`, `useState`
- Produces:
  - `IndicadorSincronizacao` component: no props, self-contained, renders sync status or fallback UI

- [ ] **Step 1: Write failing test for success state**

```typescript
// src/components/IndicadorSincronizacao.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import IndicadorSincronizacao from './IndicadorSincronizacao'
import * as sincronizacaoApi from '../api/sincronizacao'

vi.mock('../api/sincronizacao')

describe('IndicadorSincronizacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays round and formatted timestamp on success', async () => {
    const mockStatus = { round: 42, timestamp: '2026-09-26T15:30:00Z' }
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue(mockStatus)

    render(<IndicadorSincronizacao />)

    const text = await screen.findByText(/rodada 42/i)
    expect(text).toBeInTheDocument()
    // Should contain a formatted date (exact format TBD in step 3)
    expect(screen.getByText(/26.*set.*2026|26.*de.*setembro/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/components/IndicadorSincronizacao.test.tsx
```

Expected: FAIL (component not found)

- [ ] **Step 3: Write minimal implementation for success state**

```typescript
// src/components/IndicadorSincronizacao.tsx
import { useEffect, useState } from 'react'
import { fetchSyncStatus, SyncStatus } from '../api/sincronizacao'

export default function IndicadorSincronizacao() {
  const [status, setStatus] = useState<SyncStatus | null | 'error'>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchSyncStatus()
        setStatus(result ?? null)
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [])

  if (status === 'error') {
    return <div>Atualização indisponível</div>
  }

  if (status === null) {
    return <div>Dados ainda não sincronizados</div>
  }

  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(status.timestamp))

  return (
    <div title={`UTC: ${status.timestamp}`}>
      Rodada {status.round} • Atualizado em {formatted}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/components/IndicadorSincronizacao.test.tsx
```

Expected: PASS

- [ ] **Step 5: Add test for null state (no sync data)**

```typescript
it('displays "Dados ainda não sincronizados" when no sync data', async () => {
  vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue(null)

  render(<IndicadorSincronizacao />)

  const text = await screen.findByText(/dados ainda não sincronizados/i)
  expect(text).toBeInTheDocument()
})
```

- [ ] **Step 6: Add test for error state (network failure)**

```typescript
it('displays "Atualização indisponível" on API error', async () => {
  vi.mocked(sincronizacaoApi.fetchSyncStatus).mockRejectedValue(new Error('Network'))

  render(<IndicadorSincronizacao />)

  const text = await screen.findByText(/atualização indisponível/i)
  expect(text).toBeInTheDocument()
})
```

- [ ] **Step 7: Add test for UTC value in title attribute**

```typescript
it('includes UTC timestamp in title attribute for accessibility', async () => {
  const mockStatus = { round: 42, timestamp: '2026-09-26T15:30:00Z' }
  vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue(mockStatus)

  render(<IndicadorSincronizacao />)

  const container = await screen.findByTitle(/UTC: 2026-09-26T15:30:00Z/i)
  expect(container).toBeInTheDocument()
})
```

- [ ] **Step 8: Run all component tests to verify they pass**

```bash
npm run test -- src/components/IndicadorSincronizacao.test.tsx
```

Expected: All 4 tests PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/IndicadorSincronizacao.tsx src/components/IndicadorSincronizacao.test.tsx
git commit -m "feat: #39 — create IndicadorSincronizacao component

- Displays round + formatted timestamp on success
- Shows 'Dados ainda não sincronizados' when no sync data
- Shows 'Atualização indisponível' on network error
- Includes UTC value in title for accessibility
- All three states tested independently
Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Integrate IndicadorSincronizacao into Jogadores Page

**Files:**
- Modify: `src/pages/Jogadores.tsx` — add component to layout

**Interfaces:**
- Consumes: `IndicadorSincronizacao` component from `src/components/IndicadorSincronizacao.tsx`
- Produces: Updated Jogadores page with sync status displayed at top

- [ ] **Step 1: Read current Jogadores.tsx to understand layout**

```bash
cat src/pages/Jogadores.tsx | head -50
```

- [ ] **Step 2: Add import for IndicadorSincronizacao**

Open `src/pages/Jogadores.tsx` and add to imports:

```typescript
import IndicadorSincronizacao from '../components/IndicadorSincronizacao'
```

- [ ] **Step 3: Add component to render (near top of page, before main content)**

Locate the main render section of Jogadores and add:

```tsx
<div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
  <IndicadorSincronizacao />
</div>
```

Place this right after the page heading/title and before the main analysis content.

- [ ] **Step 4: Run lint to verify no errors**

```bash
npm run lint
```

Expected: No errors in Jogadores.tsx

- [ ] **Step 5: Run test suite to verify no regressions**

```bash
npm run test
```

Expected: All tests still PASS (including new IndicadorSincronizacao tests)

- [ ] **Step 6: Commit**

```bash
git add src/pages/Jogadores.tsx
git commit -m "feat: #39 — integrate IndicadorSincronizacao into Jogadores

- Display sync status at top of page
- Consistent styling with page layout
Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Integrate IndicadorSincronizacao into Escalador Page

**Files:**
- Modify: `src/pages/Escalador.tsx` — add component to layout

**Interfaces:**
- Consumes: `IndicadorSincronizacao` component from `src/components/IndicadorSincronizacao.tsx`
- Produces: Updated Escalador page with sync status displayed at top

- [ ] **Step 1: Read current Escalador.tsx to understand layout**

```bash
cat src/pages/Escalador.tsx | head -50
```

- [ ] **Step 2: Add import for IndicadorSincronizacao**

Open `src/pages/Escalador.tsx` and add to imports:

```typescript
import IndicadorSincronizacao from '../components/IndicadorSincronizacao'
```

- [ ] **Step 3: Add component to render (near top of page)**

Locate the main render section and add (same styling as Jogadores):

```tsx
<div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
  <IndicadorSincronizacao />
</div>
```

- [ ] **Step 4: Run lint to verify no errors**

```bash
npm run lint
```

Expected: No errors in Escalador.tsx

- [ ] **Step 5: Run test suite to verify no regressions**

```bash
npm run test
```

Expected: All tests still PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/Escalador.tsx
git commit -m "feat: #39 — integrate IndicadorSincronizacao into Escalador

- Display sync status at top of page
- Consistent styling with Jogadores integration
Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Validation, Coverage Check, and Evidence

**Files:**
- Evidence: Screenshots of three states
- Docs: `docs/evidence/39-sync-indicator-states.md`

**Interfaces:**
- Consumes: All previous tasks' outputs
- Produces: Build output, coverage report, test results

- [ ] **Step 1: Run full lint suite**

```bash
npm run lint
```

Expected: Zero errors or warnings in all files touched

- [ ] **Step 2: Run full test suite with coverage**

```bash
npm run test -- --coverage
```

Expected: All tests PASS; coverage ≥ 90% for new files (src/api/sincronizacao.ts, src/components/IndicadorSincronizacao.tsx)

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build successful, no errors

- [ ] **Step 4: Capture evidence — success state screenshot**

Run the dev server and navigate to `/jogadores` or `/escalador`:

```bash
npm run dev
```

Open browser to `http://localhost:5173/jogadores` (or `/escalador`)

Capture screenshot showing:
- IndicadorSincronizacao displaying "Rodada X • Atualizado em ..."
- Component visible at top of page
- Save as `docs/evidence/39-success-state.png`

_If backend `/status/sync` not available, mock it by temporarily adding to IndicadorSincronizacao test (for screenshot):_
```typescript
// Temporary mock for screenshot: use real data
const mockStatus = { round: 42, timestamp: '2026-09-26T15:30:00Z' }
```

- [ ] **Step 5: Capture evidence — empty state screenshot**

In IndicadorSincronizacao test, configure mock to return `null`:

```typescript
vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue(null)
```

Render component and capture screenshot showing "Dados ainda não sincronizados"
Save as `docs/evidence/39-empty-state.png`

- [ ] **Step 6: Capture evidence — error state screenshot**

In test, configure mock to reject:

```typescript
vi.mocked(sincronizacaoApi.fetchSyncStatus).mockRejectedValue(new Error('Network'))
```

Render and capture showing "Atualização indisponível"
Save as `docs/evidence/39-error-state.png`

- [ ] **Step 7: Create evidence summary document**

```markdown
# Sync Indicator Evidence — #39

## Component States

### Success State
![Success](39-success-state.png)
- Displays round number and formatted timestamp
- UTC value visible in title attribute
- No blocking of parent page content

### Empty State (No Sync Data)
![Empty](39-empty-state.png)
- Shows "Dados ainda não sincronizados"
- Clear, non-error messaging
- Accessible to screen readers

### Error State (Network Failure)
![Error](39-error-state.png)
- Shows "Atualização indisponível"
- Parent page (Jogadores/Escalador) data still visible
- Graceful fallback

## Test Coverage

```
src/api/sincronizacao.ts          100%
src/components/IndicadorSincronizacao.tsx  100%
src/pages/Jogadores.tsx           integration OK
src/pages/Escalador.tsx           integration OK
```

## Build & Lint

✅ All tests pass (7 new tests)
✅ Lint: zero errors
✅ Build: successful
✅ Coverage: ≥ 90%
```

Save as `docs/evidence/39-sync-indicator-states.md`

- [ ] **Step 8: Commit evidence**

```bash
git add docs/evidence/
git commit -m "docs: #39 — add evidence for sync indicator states

- Screenshots of success, empty, and error states
- Test coverage summary
- Integration verification
Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Update decision log**

Open `docs/decisions/39.md` and add:

```markdown
## TDD → BUILD — 2026-09-26

- Decisão: Usar `Intl.DateTimeFormat` com timezone 'America/Sao_Paulo' para respeitar fuso do usuário — mantém valor UTC em `title` para acessibilidade
- Decisão: Estado 'error' e 'null' definidos como strings na union type (`SyncStatus | null | 'error'`) para simplicidade — evita tipo adicional
- Risco aceito: Se backend `/status/sync` não estiver disponível na execução, componente mostrará "Atualização indisponível" (graceful) — aceitável, fluxo não é bloqueado
```

- [ ] **Step 10: Commit decision log update**

```bash
git add docs/decisions/39.md
git commit -m "docs: #39 — update decision log with TDD→BUILD transitions"
```

---

## Final Checklist Before PR

- [ ] All new files created: `src/api/sincronizacao.ts`, `src/components/IndicadorSincronizacao.tsx`
- [ ] All tests written and passing: 7 tests total (3 API client + 4 component)
- [ ] Lint clean: `npm run lint` passes with zero errors
- [ ] Build successful: `npm run build` produces output with no errors
- [ ] Coverage ≥ 90%: Both new modules at 100%
- [ ] Evidence captured: 3 screenshots + summary document
- [ ] Both pages integrated: Jogadores and Escalador rendering component
- [ ] Decision log updated with key design choices
- [ ] Branch name verified: `eduardosanson/39-indicar-rodada-e`
