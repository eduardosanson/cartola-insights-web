const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly retryAfter?: number

  constructor(message: string, status: number, code?: string, retryAfter?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

interface ErrorInfo {
  message: string
  code?: string
  retryAfter?: number
}

async function extrairMensagemDeErro(path: string, response: Response): Promise<ErrorInfo> {
  let code: string | undefined
  let retryAfter: number | undefined
  let message: string | undefined

  try {
    const corpo = (await response.json()) as { detail?: unknown; code?: unknown }
    if (typeof corpo.code === 'string') code = corpo.code
    if (typeof corpo.detail === 'string') {
      message = corpo.detail
    }
  } catch {
    // corpo não é JSON (ou já foi consumido) — cai no fallback abaixo
  }

  if (response.status === 429) {
    const retryAfterHeader = response.headers.get('retry-after')
    if (retryAfterHeader) {
      const parsed = Number.parseInt(retryAfterHeader, 10)
      if (!Number.isNaN(parsed)) retryAfter = parsed
    }
  }

  if (!message) {
    if (response.status === 401) message = 'Acesso não autorizado'
    else if (response.status === 403) message = 'Acesso negado'
    else if (response.status === 429) message = 'Serviço temporariamente indisponível. Tente novamente em instantes.'
    else message = `Erro ${response.status} ao acessar ${path}: ${response.statusText}`
  }

  return { message, code, retryAfter }
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
    const errorInfo = await extrairMensagemDeErro(path, response)
    throw new ApiError(errorInfo.message, response.status, errorInfo.code, errorInfo.retryAfter)
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
