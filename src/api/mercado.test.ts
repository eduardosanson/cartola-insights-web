import { afterEach, describe, expect, it, vi } from 'vitest'
import { buscarStatusAlterados } from './mercado'

afterEach(() => vi.restoreAllMocks())

describe('API de status do mercado', () => {
  it('busca alterações desde o instante informado em ISO', async () => {
    const alteracoes = [
      { atleta_id: 10, status_id: 5, atualizado_em: '2026-08-25T13:00:00Z' },
    ]
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(alteracoes), { status: 200 }),
    )
    const desde = new Date('2026-08-25T12:00:00Z')

    await expect(buscarStatusAlterados(desde)).resolves.toEqual(alteracoes)
    expect(fetch).toHaveBeenCalledWith(
      `/api/proxy/mercado/status-alterados?desde=${encodeURIComponent(desde.toISOString())}`,
      expect.objectContaining({ credentials: 'include' }),
    )
  })
})
