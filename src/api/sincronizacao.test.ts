import { describe, it, expect, vi } from 'vitest'
import * as apiClient from './client'
import { fetchSyncStatus } from './sincronizacao'

vi.mock('./client')

describe('fetchSyncStatus', () => {
  it('returns SyncStatus when API call succeeds', async () => {
    const mockData = { round: 42, timestamp: '2026-09-26T15:30:00Z' }
    vi.mocked(apiClient.apiGet).mockResolvedValue(mockData)

    const result = await fetchSyncStatus()

    expect(result).toEqual(mockData)
    expect(apiClient.apiGet).toHaveBeenCalledWith('/status/sync')
  })

  it('returns null when no sync data exists', async () => {
    vi.mocked(apiClient.apiGet).mockResolvedValue(null)

    const result = await fetchSyncStatus()

    expect(result).toBeNull()
  })

  it('throws ApiError when API call fails', async () => {
    const mockError = new Error('Network error')
    vi.mocked(apiClient.apiGet).mockRejectedValue(mockError)

    await expect(fetchSyncStatus()).rejects.toThrow('Network error')
  })
})
