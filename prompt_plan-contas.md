# Telas de Conta (web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir as telas de cadastro, login e "Minha conta" (gerar/listar/revogar
API token) no web app, consumindo o backend de contas já mergeado, sem alterar
o acesso público às telas existentes (Tabela/Jogadores/Detalhe).

**Architecture:** Um `AuthContext` único (React Context + `GET /contas/me` ao
montar o app) mantém o estado de sessão, já que o cookie é `httpOnly` e não
pode ser lido por JS. Um novo módulo `api/contas.ts` isola as chamadas HTTP
(mesmo padrão de `api/atletas.ts`), sobre um cliente HTTP (`api/client.ts`)
estendido com `apiPost`/`apiDelete` e `credentials: 'include'`. Três páginas
novas (`Login`, `Registro`, `MinhaConta`) e uma rota protegida
(`RotaProtegida`) que redireciona para `/entrar` sem sessão. `Nav` passa a
consumir o contexto para alternar entre "Entrar" e email+"Sair".

**Tech Stack:** React 19 + Vite + TypeScript + react-router-dom 7 + Vitest +
React Testing Library (mesmo stack já usado no projeto, sem libs novas).

**Spec:** `spec-contas.md`

## Global Constraints

- Cobertura de testes ≥ 90% (mesma régua do repositório).
- Toda chamada de API (leitura ou escrita) envia `credentials: 'include'`
  (RNF03) — necessário pro cookie de sessão ir e voltar entre `:5173` e
  `:8000` no dev.
- Chamadas de API isoladas em módulo (`api/contas.ts`), sem fetch espalhado
  pelos componentes (RNF02).
- Sem dado fictício — tudo consome a API real (RNF04).
- Registro não loga automaticamente (o backend não cria sessão nesse
  endpoint) — sucesso redireciona para `/entrar` com mensagem.
- O valor cru do API token só é exibido uma vez, na resposta de
  `POST /contas/tokens` (CA05) — nunca reconsultável depois.
- Estilo do projeto: componentes funcionais simples, `useState`/`useEffect`,
  sem lib de formulário/estado global; erros exibidos com `<p role="alert">`;
  cores via variáveis CSS (`--danger` para erro, `--accent-home` etc.) já
  definidas em `theme.css`.
- Testes mockam `fetch` via `vi.stubGlobal('fetch', ...)` (nível de cliente
  HTTP) ou o módulo `api/contas` via `vi.mock` (nível de página/contexto) —
  seguir o padrão já usado em `client.test.ts`.

---

### Task 1: Cliente HTTP — `apiPost`/`apiDelete` + credenciais + mensagem de erro do backend

**Files:**
- Modify: `src/api/client.ts`
- Modify: `src/api/client.test.ts`

**Interfaces:**
- Produces: `apiGet<T>(path: string): Promise<T>` (assinatura inalterada, mas agora envia `credentials: 'include'`), `apiPost<T>(path: string, body?: unknown): Promise<T>`, `apiDelete(path: string): Promise<void>` — usados por [[Task 2]].

- [ ] **Step 1: Ler o arquivo atual e escrever o teste que falha (credenciais)**

Em `src/api/client.test.ts`, no teste existente `'returns parsed JSON on a 2xx response'`, trocar a asserção final:

```ts
expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/clubes', {
  credentials: 'include',
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- client.test.ts`
Expected: FAIL — `fetchMock` foi chamado só com a URL, sem o segundo argumento.

- [ ] **Step 3: Refatorar `client.ts`**

Substituir todo o conteúdo de `src/api/client.ts` por:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function extrairMensagemDeErro(path: string, response: Response): Promise<string> {
  try {
    const corpo = (await response.json()) as { detail?: unknown }
    if (typeof corpo.detail === 'string') return corpo.detail
  } catch {
    // corpo não é JSON (ou já foi consumido) — cai no fallback abaixo
  }
  return `Erro ${response.status} ao acessar ${path}: ${response.statusText}`
}

async function requisitar<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', ...init })
  } catch (cause) {
    throw new Error(`Falha de rede ao acessar ${path}: ${(cause as Error).message}`)
  }

  if (!response.ok) {
    throw new Error(await extrairMensagemDeErro(path, response))
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/**
 * GET JSON from the backend API. Throws a clear Error on network failure
 * or a non-2xx response — callers must handle it, it is never swallowed.
 */
export function apiGet<T>(path: string): Promise<T> {
  return requisitar<T>(path)
}

/** POST JSON to the backend API. Same error contract as apiGet. */
export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return requisitar<T>(path, {
    method: 'POST',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

/** DELETE against the backend API. Same error contract as apiGet. */
export function apiDelete(path: string): Promise<void> {
  return requisitar<void>(path, { method: 'DELETE' })
}
```

- [ ] **Step 4: Rodar e confirmar que os testes existentes passam**

Run: `npm test -- client.test.ts`
Expected: os 3 testes existentes (`apiGet`) passam com a nova assinatura.

- [ ] **Step 5: Escrever os testes de `apiPost`/`apiDelete` e da mensagem de erro do backend**

Adicionar a `src/api/client.test.ts`:

```ts
import { apiDelete, apiGet, apiPost } from './client'

describe('apiPost', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a JSON body and returns the parsed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: async () => ({ id: 1 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiPost<{ id: number }>('/contas/registro', {
      email: 'a@b.com',
      senha: 'segredo123',
    })

    expect(result).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/contas/registro', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', senha: 'segredo123' }),
    })
  })

  it('posts without a body when none is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiPost<undefined>('/contas/logout')

    expect(result).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/contas/logout', {
      credentials: 'include',
      method: 'POST',
      headers: undefined,
      body: undefined,
    })
  })

  it('throws the backend detail message on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({ detail: 'email já cadastrado: a@b.com' }),
      }),
    )

    await expect(apiPost('/contas/registro', { email: 'a@b.com' })).rejects.toThrow(
      'email já cadastrado: a@b.com',
    )
  })
})

describe('apiDelete', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a DELETE request and resolves with no value', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiDelete('/contas/tokens/1')

    expect(result).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/contas/tokens/1', {
      credentials: 'include',
      method: 'DELETE',
    })
  })
})
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npm test -- client.test.ts`
Expected: todos os testes (apiGet + apiPost + apiDelete) passam.

- [ ] **Step 7: Lint e commit**

Run: `npm run lint`

```bash
git add src/api/client.ts src/api/client.test.ts
git commit -m "feat: adiciona apiPost/apiDelete e credenciais ao cliente HTTP"
```

---

### Task 2: Módulo `api/contas.ts`

**Files:**
- Create: `src/api/contas.ts`
- Create: `src/api/contas.test.ts`

**Interfaces:**
- Consumes: `apiGet`, `apiPost`, `apiDelete` de [[Task 1]].
- Produces: tipos `Usuario`, `ApiToken`, `ApiTokenCriado`; funções `registrar`, `login`, `logout`, `obterUsuarioAtual`, `gerarToken`, `listarTokens`, `revogarToken` — usadas por [[Task 3]] (AuthContext) e pelas páginas ([[Task 5]], [[Task 6]], [[Task 7]]).

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/api/contas.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  registrar,
  login,
  logout,
  obterUsuarioAtual,
  gerarToken,
  listarTokens,
  revogarToken,
} from './contas'

function mockFetchOk(status: number, corpo: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status,
      statusText: 'OK',
      json: async () => corpo,
    }),
  )
}

describe('api/contas', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registrar chama POST /contas/registro com email e senha', async () => {
    mockFetchOk(201, { id: 1, email: 'a@b.com', role: 'usuario' })
    const usuario = await registrar('a@b.com', 'segredo123')
    expect(usuario).toEqual({ id: 1, email: 'a@b.com', role: 'usuario' })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/registro',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', senha: 'segredo123' }),
      }),
    )
  })

  it('login chama POST /contas/login com email e senha', async () => {
    mockFetchOk(200, { id: 1, email: 'a@b.com', role: 'usuario' })
    const usuario = await login('a@b.com', 'segredo123')
    expect(usuario.email).toBe('a@b.com')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', senha: 'segredo123' }),
      }),
    )
  })

  it('logout chama POST /contas/logout', async () => {
    mockFetchOk(204, {})
    await logout()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/logout',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('obterUsuarioAtual chama GET /contas/me', async () => {
    mockFetchOk(200, { id: 1, email: 'a@b.com', role: 'admin' })
    const usuario = await obterUsuarioAtual()
    expect(usuario.role).toBe('admin')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/me',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('gerarToken chama POST /contas/tokens e retorna o valor cru', async () => {
    mockFetchOk(201, { id: 5, token: 'abc123', criado_em: '2026-08-23T00:00:00Z', revogado_em: null })
    const criado = await gerarToken()
    expect(criado.token).toBe('abc123')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/tokens',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('listarTokens chama GET /contas/tokens', async () => {
    mockFetchOk(200, [{ id: 5, criado_em: '2026-08-23T00:00:00Z', revogado_em: null }])
    const tokens = await listarTokens()
    expect(tokens).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/tokens',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('revogarToken chama DELETE /contas/tokens/{id}', async () => {
    mockFetchOk(204, {})
    await revogarToken(5)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/tokens/5',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- contas.test.ts`
Expected: FAIL com `Cannot find module './contas'`

- [ ] **Step 3: Implementar `api/contas.ts`**

Criar `src/api/contas.ts`:

```ts
import { apiDelete, apiGet, apiPost } from './client'

export type Papel = 'admin' | 'usuario'

export interface Usuario {
  id: number
  email: string
  role: Papel
}

export interface ApiToken {
  id: number
  criado_em: string
  revogado_em: string | null
}

export interface ApiTokenCriado extends ApiToken {
  token: string
}

export function registrar(email: string, senha: string): Promise<Usuario> {
  return apiPost<Usuario>('/contas/registro', { email, senha })
}

export function login(email: string, senha: string): Promise<Usuario> {
  return apiPost<Usuario>('/contas/login', { email, senha })
}

export function logout(): Promise<void> {
  return apiPost<void>('/contas/logout')
}

export function obterUsuarioAtual(): Promise<Usuario> {
  return apiGet<Usuario>('/contas/me')
}

export function gerarToken(): Promise<ApiTokenCriado> {
  return apiPost<ApiTokenCriado>('/contas/tokens')
}

export function listarTokens(): Promise<ApiToken[]> {
  return apiGet<ApiToken[]>('/contas/tokens')
}

export function revogarToken(id: number): Promise<void> {
  return apiDelete(`/contas/tokens/${id}`)
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- contas.test.ts`
Expected: 7 passed

- [ ] **Step 5: Lint e commit**

```bash
git add src/api/contas.ts src/api/contas.test.ts
git commit -m "feat: adiciona cliente tipado api/contas (registro, login, tokens)"
```

---

### Task 3: `AuthContext` (estado de sessão global)

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/contexts/AuthContext.test.tsx`

**Interfaces:**
- Consumes: `obterUsuarioAtual`, `logout` (renomeado `logoutRequest` no import), `type Usuario` de [[Task 2]].
- Produces: `AuthProvider` (componente), `useAuth(): { usuario: Usuario | null, carregando: boolean, refetch: () => Promise<void>, logout: () => Promise<void> }` — usado por [[Task 4]], [[Task 5]], [[Task 6]], [[Task 7]], [[Task 8]], [[Task 9]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/contexts/AuthContext.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import * as contasApi from '../api/contas'

vi.mock('../api/contas')

function Consumidor() {
  const { usuario, carregando, logout } = useAuth()
  if (carregando) return <p>carregando</p>
  return (
    <div>
      <p>{usuario ? usuario.email : 'deslogado'}</p>
      <button onClick={() => logout()}>sair</button>
    </div>
  )
}

describe('AuthContext', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('inicia carregando e resolve para o usuário quando a sessão é válida', async () => {
    vi.mocked(contasApi.obterUsuarioAtual).mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      role: 'usuario',
    })

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    )

    expect(screen.getByText('carregando')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument())
  })

  it('resolve para deslogado quando não há sessão válida', async () => {
    vi.mocked(contasApi.obterUsuarioAtual).mockRejectedValue(new Error('401'))

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())
  })

  it('logout chama a API e limpa o usuário', async () => {
    vi.mocked(contasApi.obterUsuarioAtual).mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      role: 'usuario',
    })
    vi.mocked(contasApi.logout).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument())
    await user.click(screen.getByText('sair'))

    expect(contasApi.logout).toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())
  })

  it('useAuth fora do AuthProvider lança erro', () => {
    function ForaDoProvider() {
      useAuth()
      return null
    }
    expect(() => render(<ForaDoProvider />)).toThrow(/AuthProvider/)
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- AuthContext.test.tsx`
Expected: FAIL com `Cannot find module './AuthContext'`

- [ ] **Step 3: Implementar `AuthContext.tsx`**

Criar `src/contexts/AuthContext.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { obterUsuarioAtual, logout as logoutRequest, type Usuario } from '../api/contas'

interface AuthContextValue {
  usuario: Usuario | null
  carregando: boolean
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const dados = await obterUsuarioAtual()
      setUsuario(dados)
    } catch {
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, carregando, refetch, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return contexto
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- AuthContext.test.tsx`
Expected: 4 passed

- [ ] **Step 5: Lint e commit**

```bash
git add src/contexts/AuthContext.tsx src/contexts/AuthContext.test.tsx
git commit -m "feat: adiciona AuthContext (estado de sessao global)"
```

---

### Task 4: `RotaProtegida`

**Files:**
- Create: `src/components/RotaProtegida.tsx`
- Create: `src/components/RotaProtegida.test.tsx`

**Interfaces:**
- Consumes: `useAuth` de [[Task 3]].
- Produces: `RotaProtegida({ children }): JSX.Element` — usado por [[Task 9]] pra proteger `/conta`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/RotaProtegida.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RotaProtegida from './RotaProtegida'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

function renderComRota(rotaInicial: string) {
  render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <Routes>
        <Route path="/entrar" element={<p>tela de login</p>} />
        <Route
          path="/conta"
          element={
            <RotaProtegida>
              <p>conteúdo protegido</p>
            </RotaProtegida>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RotaProtegida', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra carregando enquanto a sessão ainda não resolveu', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: true,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    renderComRota('/conta')
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('redireciona para /entrar quando não há usuário', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    renderComRota('/conta')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })

  it('renderiza o conteúdo protegido quando há usuário', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    renderComRota('/conta')
    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- RotaProtegida.test.tsx`
Expected: FAIL com `Cannot find module './RotaProtegida'`

- [ ] **Step 3: Implementar `RotaProtegida.tsx`**

Criar `src/components/RotaProtegida.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <p>Carregando…</p>
  if (!usuario) return <Navigate to="/entrar" replace />
  return <>{children}</>
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- RotaProtegida.test.tsx`
Expected: 3 passed

- [ ] **Step 5: Lint e commit**

```bash
git add src/components/RotaProtegida.tsx src/components/RotaProtegida.test.tsx
git commit -m "feat: adiciona RotaProtegida (redireciona para /entrar sem sessao)"
```

---

### Task 5: Página Login

**Files:**
- Create: `src/pages/Login.tsx`
- Create: `src/pages/Login.test.tsx`

**Interfaces:**
- Consumes: `login` de [[Task 2]]; `useAuth` (só `refetch`) de [[Task 3]].
- Produces: componente `Login`, montado em `/entrar` por [[Task 9]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/pages/Login.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Login from './Login'
import * as contasApi from '../api/contas'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../api/contas')
vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

function renderLogin() {
  const refetch = vi.fn().mockResolvedValue(undefined)
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({
    usuario: null,
    carregando: false,
    refetch,
    logout: vi.fn(),
  })
  render(
    <MemoryRouter initialEntries={['/entrar']}>
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/" element={<p>tela inicial</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { refetch }
}

describe('Login', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('envia email e senha, chama refetch e redireciona para / em caso de sucesso', async () => {
    vi.mocked(contasApi.login).mockResolvedValue({ id: 1, email: 'a@b.com', role: 'usuario' })
    const { refetch } = renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'segredo123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(contasApi.login).toHaveBeenCalledWith('a@b.com', 'segredo123')
    expect(refetch).toHaveBeenCalled()
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
  })

  it('mostra mensagem de erro quando o login falha', async () => {
    vi.mocked(contasApi.login).mockRejectedValue(new Error('email ou senha inválidos'))
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'errada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('email ou senha inválidos')
  })

  it('tem link para a tela de registro', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /criar conta/i })).toHaveAttribute(
      'href',
      '/registrar',
    )
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Login.test.tsx`
Expected: FAIL com `Cannot find module './Login'`

- [ ] **Step 3: Implementar `Login.tsx`**

Criar `src/pages/Login.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/contas'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const { refetch } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { mensagem?: string } }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(email, senha)
      await refetch()
      navigate('/')
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <h2>Entrar</h2>
      {location.state?.mensagem && <p role="status">{location.state.mensagem}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      {erro && (
        <p role="alert" style={{ color: 'var(--danger)' }}>
          {erro}
        </p>
      )}
      <p>
        Não tem conta? <Link to="/registrar">Criar conta</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Login.test.tsx`
Expected: 3 passed

- [ ] **Step 5: Lint e commit**

```bash
git add src/pages/Login.tsx src/pages/Login.test.tsx
git commit -m "feat: adiciona tela de login (/entrar)"
```

---

### Task 6: Página Registro

**Files:**
- Create: `src/pages/Registro.tsx`
- Create: `src/pages/Registro.test.tsx`

**Interfaces:**
- Consumes: `registrar` de [[Task 2]].
- Produces: componente `Registro`, montado em `/registrar` por [[Task 9]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/pages/Registro.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Registro from './Registro'
import * as contasApi from '../api/contas'

vi.mock('../api/contas')

function renderRegistro() {
  render(
    <MemoryRouter initialEntries={['/registrar']}>
      <Routes>
        <Route path="/registrar" element={<Registro />} />
        <Route
          path="/entrar"
          element={<p>tela de login</p>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Registro', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('registra e redireciona para /entrar em caso de sucesso', async () => {
    vi.mocked(contasApi.registrar).mockResolvedValue({ id: 1, email: 'a@b.com', role: 'usuario' })
    renderRegistro()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'segredo123')
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(contasApi.registrar).toHaveBeenCalledWith('a@b.com', 'segredo123')
    expect(await screen.findByText('tela de login')).toBeInTheDocument()
  })

  it('mostra mensagem de erro em caso de email duplicado', async () => {
    vi.mocked(contasApi.registrar).mockRejectedValue(
      new Error('email já cadastrado: a@b.com'),
    )
    renderRegistro()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'segredo123')
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('email já cadastrado')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Registro.test.tsx`
Expected: FAIL com `Cannot find module './Registro'`

- [ ] **Step 3: Implementar `Registro.tsx`**

Criar `src/pages/Registro.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { registrar } from '../api/contas'

const SENHA_MINIMA = 8

export default function Registro() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await registrar(email, senha)
      navigate('/entrar', { state: { mensagem: 'Conta criada! Faça login.' } })
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <h2>Criar conta</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            minLength={SENHA_MINIMA}
            required
          />
        </label>
        <button type="submit" disabled={enviando}>
          {enviando ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      {erro && (
        <p role="alert" style={{ color: 'var(--danger)' }}>
          {erro}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Registro.test.tsx`
Expected: 2 passed

- [ ] **Step 5: Lint e commit**

```bash
git add src/pages/Registro.tsx src/pages/Registro.test.tsx
git commit -m "feat: adiciona tela de registro (/registrar)"
```

---

### Task 7: Página Minha Conta

**Files:**
- Create: `src/pages/MinhaConta.tsx`
- Create: `src/pages/MinhaConta.test.tsx`

**Interfaces:**
- Consumes: `gerarToken`, `listarTokens`, `revogarToken`, `type ApiToken` de [[Task 2]]; `useAuth` (só `usuario`) de [[Task 3]].
- Produces: componente `MinhaConta`, montado em `/conta` (dentro de `RotaProtegida`) por [[Task 9]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/pages/MinhaConta.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MinhaConta from './MinhaConta'
import * as contasApi from '../api/contas'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../api/contas')
vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

function mockUsuarioLogado() {
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({
    usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
    carregando: false,
    refetch: vi.fn(),
    logout: vi.fn(),
  })
}

describe('MinhaConta', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o email do usuário e a lista de tokens', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([
      { id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null },
    ])

    render(<MinhaConta />)

    expect(screen.getByText(/a@b.com/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())
  })

  it('mostra estado vazio quando não há tokens', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])

    render(<MinhaConta />)

    await waitFor(() =>
      expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument(),
    )
  })

  it('gera um token e mostra o valor cru uma vez', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])
    vi.mocked(contasApi.gerarToken).mockResolvedValue({
      id: 2,
      token: 'valor-cru-do-token',
      criado_em: '2026-08-23T00:00:00Z',
      revogado_em: null,
    })
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /gerar token/i }))

    expect(await screen.findByText('valor-cru-do-token')).toBeInTheDocument()
  })

  it('revoga um token e atualiza a lista', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens)
      .mockResolvedValueOnce([{ id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null }])
      .mockResolvedValueOnce([
        { id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: '2026-08-23T01:00:00Z' },
      ])
    vi.mocked(contasApi.revogarToken).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /revogar/i }))

    expect(contasApi.revogarToken).toHaveBeenCalledWith(1)
    await waitFor(() => expect(screen.getByText('Revogado')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- MinhaConta.test.tsx`
Expected: FAIL com `Cannot find module './MinhaConta'`

- [ ] **Step 3: Implementar `MinhaConta.tsx`**

Criar `src/pages/MinhaConta.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { gerarToken, listarTokens, revogarToken, type ApiToken } from '../api/contas'
import { useAuth } from '../contexts/AuthContext'

export default function MinhaConta() {
  const { usuario } = useAuth()
  const [tokens, setTokens] = useState<ApiToken[] | null>(null)
  const [tokenGerado, setTokenGerado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function carregarTokens() {
    listarTokens()
      .then(setTokens)
      .catch((err: Error) => setErro(err.message))
  }

  useEffect(() => {
    carregarTokens()
  }, [])

  async function handleGerarToken() {
    setErro(null)
    try {
      const criado = await gerarToken()
      setTokenGerado(criado.token)
      carregarTokens()
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  async function handleRevogar(id: number) {
    setErro(null)
    try {
      await revogarToken(id)
      carregarTokens()
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  function handleCopiar() {
    if (tokenGerado && navigator.clipboard) {
      navigator.clipboard.writeText(tokenGerado)
    }
  }

  return (
    <div>
      <h2>Minha conta</h2>
      {usuario && (
        <p>
          {usuario.email} · {usuario.role}
        </p>
      )}

      {erro && (
        <p role="alert" style={{ color: 'var(--danger)' }}>
          {erro}
        </p>
      )}

      <button onClick={handleGerarToken}>Gerar token</button>

      {tokenGerado && (
        <div role="status">
          <p>Copie agora — este valor não será mostrado de novo:</p>
          <code>{tokenGerado}</code>
          <button onClick={handleCopiar}>Copiar</button>
        </div>
      )}

      {!erro && tokens === null && <p>Carregando tokens…</p>}
      {!erro && tokens && tokens.length === 0 && <p>Nenhum token gerado ainda.</p>}
      {!erro && tokens && tokens.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Criado em</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td>{new Date(token.criado_em).toLocaleString('pt-BR')}</td>
                <td>{token.revogado_em ? 'Revogado' : 'Ativo'}</td>
                <td>
                  {!token.revogado_em && (
                    <button onClick={() => handleRevogar(token.id)}>Revogar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- MinhaConta.test.tsx`
Expected: 4 passed

- [ ] **Step 5: Lint e commit**

```bash
git add src/pages/MinhaConta.tsx src/pages/MinhaConta.test.tsx
git commit -m "feat: adiciona tela Minha conta (gerar/listar/revogar api token)"
```

---

### Task 8: Navegação dinâmica

**Files:**
- Modify: `src/components/Nav.tsx`
- Create: `src/components/Nav.test.tsx`

**Interfaces:**
- Consumes: `useAuth` de [[Task 3]].

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/Nav.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

describe('Nav', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra link Entrar quando deslogado', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument()
  })

  it('mostra o email e o botão Sair quando logado', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
      carregando: false,
      refetch: vi.fn(),
      logout,
    })
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'a@b.com' })).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(logout).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Nav.test.tsx`
Expected: FAIL — `Nav` ainda não usa `useAuth`, então os textos "Entrar"/email não existem.

- [ ] **Step 3: Implementar a navegação dinâmica**

Substituir todo o conteúdo de `src/components/Nav.tsx` por:

```tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: '0.5rem 1rem',
  textDecoration: 'none',
  fontFamily: 'var(--font-heading)',
  color: isActive ? 'var(--accent-home)' : 'var(--text)',
  borderBottom: isActive ? '2px solid var(--accent-home)' : '2px solid transparent',
})

export default function Nav() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSair() {
    await logout()
    navigate('/')
  }

  return (
    <nav
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        marginBottom: '1.5rem',
      }}
    >
      <NavLink to="/tabela" style={linkStyle}>
        Tabela
      </NavLink>
      <NavLink to="/jogadores" style={linkStyle}>
        Jogadores
      </NavLink>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {usuario ? (
          <>
            <NavLink to="/conta" style={linkStyle}>
              {usuario.email}
            </NavLink>
            <button onClick={handleSair}>Sair</button>
          </>
        ) : (
          <NavLink to="/entrar" style={linkStyle}>
            Entrar
          </NavLink>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Nav.test.tsx`
Expected: 2 passed

- [ ] **Step 5: Lint e commit**

```bash
git add src/components/Nav.tsx src/components/Nav.test.tsx
git commit -m "feat: navegacao alterna entre Entrar e email+Sair conforme sessao"
```

---

### Task 9: Integração no `App.tsx`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `AuthProvider` de [[Task 3]]; `RotaProtegida` de [[Task 4]]; `Login`, `Registro`, `MinhaConta` de [[Task 5]], [[Task 6]], [[Task 7]].

- [ ] **Step 1: Atualizar `App.test.tsx` pra não bater na rede de verdade**

`App.tsx` vai passar a montar `AuthProvider`, que chama `GET /contas/me` ao
montar. Sem mock, o teste existente dispararia uma chamada de rede real.
Substituir todo o conteúdo de `src/App.test.tsx` por:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders without crashing', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'credencial ausente ou inválida' }),
      }),
    )
    render(<App />)
    expect(screen.getByText('Cartola Insights')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que passa (com o `AuthProvider` ainda não adicionado, este teste já deve passar sem mudança de comportamento)**

Run: `npm test -- App.test.tsx`
Expected: PASS (o mock de fetch é inofensivo até o `AuthProvider` existir).

- [ ] **Step 3: Integrar as rotas e o `AuthProvider` em `App.tsx`**

Substituir todo o conteúdo de `src/App.tsx` por:

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Nav from './components/Nav'
import RotaProtegida from './components/RotaProtegida'
import Tabela from './pages/Tabela'
import Jogadores from './pages/Jogadores'
import DetalheJogador from './pages/DetalheJogador'
import Login from './pages/Login'
import Registro from './pages/Registro'
import MinhaConta from './pages/MinhaConta'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '1rem' }}>
          <h1>Cartola Insights</h1>
          <Nav />
          <Routes>
            <Route path="/" element={<Navigate to="/tabela" replace />} />
            <Route path="/tabela" element={<Tabela />} />
            <Route path="/jogadores" element={<Jogadores />} />
            <Route path="/jogadores/:id" element={<DetalheJogador />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/registrar" element={<Registro />} />
            <Route
              path="/conta"
              element={
                <RotaProtegida>
                  <MinhaConta />
                </RotaProtegida>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 4: Rodar a suíte inteira e confirmar que passa**

Run: `npm test`
Expected: todos os testes passam (App.tsx agora monta `Nav`, que exige o
`AuthProvider` no topo da árvore — a ordem `AuthProvider` > `BrowserRouter`
garante isso).

- [ ] **Step 5: Build de produção**

Run: `npm run build`
Expected: sem erros (CA08).

- [ ] **Step 6: Lint, cobertura e commit**

Run: `npm run lint`
Run: `npm run coverage`
Expected: cobertura ≥ 90%.

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: integra rotas e AuthProvider de contas no App"
```

---

### Task 10: Documentação e fechamento (evidências, DOD)

**Files:**
- Create: `docs/evidence/contas.md`
- Modify: `spec-contas.md`

- [ ] **Step 1: Escrever as evidências e o passo a passo de validação humana**

Criar `docs/evidence/contas.md` com: lista de arquivos criados/modificados,
saída de `npm run coverage` (resumo), e um passo a passo manual cobrindo:
abrir `/registrar` e criar uma conta → ser redirecionado a `/entrar` com a
mensagem de sucesso → logar → ver o email na navegação → acessar `/conta` →
gerar um token e copiá-lo → revogar o token → clicar em "Sair" e confirmar
que a navegação volta a mostrar "Entrar" e que `/conta` redireciona de
volta pra `/entrar`.

- [ ] **Step 2: Marcar o DOD no spec**

Em `spec-contas.md`, marcar todos os itens da seção `Definition of Done`
como `[x]`.

- [ ] **Step 3: Commit**

```bash
git add docs/evidence/contas.md spec-contas.md
git commit -m "docs: evidencias e DOD das telas de conta"
```
