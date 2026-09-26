import { apiGet } from './client'

export interface SyncStatus {
  round: number | null
  timestamp: string
}

interface StatusDadosResponse {
  estado: 'sincronizado' | 'sem_dados'
  rodada: number | null
  sincronizado_em: string | null
}

export async function fetchSyncStatus(): Promise<SyncStatus | null> {
  const dados = await apiGet<StatusDadosResponse>('/dados/status')
  if (dados.estado !== 'sincronizado' || !dados.sincronizado_em) return null
  return { round: dados.rodada, timestamp: dados.sincronizado_em }
}
