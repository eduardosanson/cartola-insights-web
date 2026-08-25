import { apiGet } from './client'

export interface StatusAlterado {
  atleta_id: number
  status_id: number
  atualizado_em: string
}

export function buscarStatusAlterados(desde: Date): Promise<StatusAlterado[]> {
  const params = new URLSearchParams({ desde: desde.toISOString() })
  return apiGet<StatusAlterado[]>(`/mercado/status-alterados?${params.toString()}`)
}
