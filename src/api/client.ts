const PROXY_PATH = '/api/proxy'

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
    const corpo = (await response.json()) as { detail?: unknown; code?: unknown }
    if (typeof corpo.detail === 'string') return corpo.detail
    if (typeof corpo.code === 'string') return corpo.code
  } catch {
    // corpo não é JSON (ou já foi consumido) — cai no fallback abaixo
  }
  if (response.status === 401) return 'Acesso não autorizado'
  if (response.status === 403) return 'Acesso negado'
  return `Erro ${response.status} ao acessar ${path}: ${response.statusText}`
}

async function requisitar<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const proxyPath = `${PROXY_PATH}${normalizedPath}`
  let response: Response
  try {
    response = await fetch(proxyPath, {
      credentials: 'include',
      ...init,
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
 * GET JSON from the backend API via proxy. Throws a clear Error on network failure
 * or a non-2xx response — callers must handle it, it is never swallowed.
 */
export function apiGet<T>(path: string): Promise<T> {
  return requisitar<T>(path)
}

/** POST JSON to the backend API via proxy. Same error contract as apiGet. */
export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return requisitar<T>(path, {
    method: 'POST',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

/** DELETE against the backend API via proxy. Same error contract as apiGet. */
export function apiDelete(path: string): Promise<void> {
  return requisitar<void>(path, { method: 'DELETE' })
}
