const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * GET JSON from the backend API. Throws a clear Error on network failure
 * or a non-2xx response — callers must handle it, it is never swallowed.
 */
export async function apiGet<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`)
  } catch (cause) {
    throw new Error(`Falha de rede ao acessar ${path}: ${(cause as Error).message}`)
  }

  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao acessar ${path}: ${response.statusText}`)
  }

  return (await response.json()) as T
}
