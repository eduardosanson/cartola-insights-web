import { describe, it, expect, vi } from 'vitest'
import * as apiClient from './client'
import { fetchSyncStatus } from './sincronizacao'

vi.mock('./client')

describe('fetchSyncStatus', () => {
  it('maps the GET /dados/status contract to SyncStatus', async () => {
    vi.mocked(apiClient.apiGet).mockResolvedValue({
      estado: 'sincronizado',
      rodada: 42,
      sincronizado_em: '2026-09-26T15:30:00Z',
    })

    const result = await fetchSyncStatus()

    expect(result).toEqual({ round: 42, timestamp: '2026-09-26T15:30:00Z' })
    expect(apiClient.apiGet).toHaveBeenCalledWith('/dados/status')
  })

  it('returns null when estado is sem_dados', async () => {
    vi.mocked(apiClient.apiGet).mockResolvedValue({
      estado: 'sem_dados',
      rodada: null,
      sincronizado_em: null,
    })

    expect(await fetchSyncStatus()).toBeNull()
  })

  it('throws when API call fails', async () => {
    vi.mocked(apiClient.apiGet).mockRejectedValue(new Error('Network error'))

    await expect(fetchSyncStatus()).rejects.toThrow('Network error')
  })
})
