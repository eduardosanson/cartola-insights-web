import { describe, it, expect, vi } from 'vitest'
import { listarClubes } from './clubes'
import * as client from './client'

describe('listarClubes', () => {
  it('calls GET /clubes and returns the list', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet').mockResolvedValue([
      { id: 1, nome: 'Flamengo', media_pontos_casa: 55.2, media_pontos_fora: 48.1 },
    ])

    const result = await listarClubes()

    expect(apiGetSpy).toHaveBeenCalledWith('/clubes')
    expect(result).toEqual([
      { id: 1, nome: 'Flamengo', media_pontos_casa: 55.2, media_pontos_fora: 48.1 },
    ])
  })
})
