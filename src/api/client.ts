const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

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
  if (response.status === 401) return 'Acesso não autorizado'
  if (response.status === 403) return 'Acesso negado'
  return `Erro ${response.status} ao acessar ${path}: ${response.statusText}`
}

async function requisitar<T>(path: string, init?: RequestInit): Promise<T> {
  const serviceToken = import.meta.env.VITE_SERVICE_TOKEN
  const headersPadrao: Record<string, string> = serviceToken
    ? { 'X-Service-Token': serviceToken }
    : {}
  const headersPersonalizados = init?.headers as Record<string, string> | undefined
  const headersMesclados = { ...headersPadrao, ...headersPersonalizados }
  const temHeaders = Object.keys(headersMesclados).length > 0

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...init,
      ...(temHeaders ? { headers: headersMesclados } : {}),
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
