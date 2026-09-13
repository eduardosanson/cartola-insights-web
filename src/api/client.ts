const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * Header exigido pelo backend blindado por service token. Só é injetado quando
 * `VITE_SERVICE_TOKEN` está configurada para o ambiente (ex.: E2E/staging) —
 * em produção essa var não é definida, então nenhum segredo real é embutido
 * no bundle público por efeito desta mudança.
 *
 * Débito técnico conhecido: por ser lida via `import.meta.env` (prefixo
 * `VITE_`), caso a var venha a ser configurada em produção, seu valor fica
 * em texto plano no bundle. A correção definitiva (proxy server-side) está
 * rastreada na issue #18.
 */
function headerServiceToken(): Record<string, string> | undefined {
  const token = import.meta.env.VITE_SERVICE_TOKEN
  return token ? { 'X-Service-Token': token } : undefined
}

/**
 * Mescla o X-Service-Token com os headers explícitos do chamador. Em caso de
 * colisão de chave, o header explícito do chamador tem prioridade — nunca é
 * sobrescrito pelo token (hoje nenhum chamador colide, já que usam chaves
 * diferentes: `Content-Type` vs `X-Service-Token`).
 *
 * Recebe `Record<string, string>` em vez de `HeadersInit` de propósito: os
 * únicos chamadores (`apiPost`) sempre passam objeto literal, e essa
 * assinatura mais estreita faz o TypeScript acusar em tempo de compilação
 * caso um chamador futuro tente passar uma instância de `Headers` ou um
 * array de tuplas — formatos que o spread abaixo não mesclaria corretamente.
 */
function mesclarHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
  const tokenHeader = headerServiceToken()
  if (!tokenHeader && !headers) return undefined
  return { ...tokenHeader, ...headers }
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function extrairMensagemDeErro(path: string, response: Response): Promise<string> {
  try {
    const corpo = (await response.json()) as { detail?: unknown }
    if (typeof corpo.detail === 'string') return corpo.detail
  } catch {
    // corpo não é JSON (ou já foi consumido) — cai no fallback abaixo
  }
  return `Erro ${response.status} ao acessar ${path}: ${response.statusText}`
}

/** Como `RequestInit`, mas `headers` restrito a objeto literal — ver JSDoc de `mesclarHeaders`. */
interface RequisicaoInit extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
}

async function requisitar<T>(path: string, init?: RequisicaoInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...init,
      headers: mesclarHeaders(init?.headers),
    })
  } catch (cause) {
    throw new Error(`Falha de rede ao acessar ${path}: ${(cause as Error).message}`)
  }

  if (!response.ok) {
    throw new ApiError(await extrairMensagemDeErro(path, response), response.status)
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
