import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiGet } from './client'

describe('apiGet', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on a 2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ hello: 'world' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiGet<{ hello: string }>('/clubes')

    expect(result).toEqual({ hello: 'world' })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/clubes')
  })

  it('throws a clear error on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      }),
    )

    await expect(apiGet('/clubes')).rejects.toThrow(/500/)
  })

  it('throws a clear error on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')))

    await expect(apiGet('/clubes')).rejects.toThrow(/Falha de rede/)
  })
})
