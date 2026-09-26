import { apiGet } from './client'

export interface SyncStatus {
  round: number
  timestamp: string
}

export async function fetchSyncStatus(): Promise<SyncStatus | null> {
  return apiGet<SyncStatus | null>('/status/sync')
}
