import { describe, it, expect, vi, afterEach } from 'vitest'
import { buscarPercentisAtleta } from './percentis'

describe('api/percentis', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('busca GET /atletas/id/percentis e retorna o corpo tipado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          atleta_id: 1,
          pontuacao_media: 80,
          participacao_gol: 91,
          desarme: 40,
          disciplina: 65,
        }),
      }),
    )

    const resultado = await buscarPercentisAtleta(1)

    expect(resultado).toEqual({
      atleta_id: 1,
      pontuacao_media: 80,
      participacao_gol: 91,
      desarme: 40,
      disciplina: 65,
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/atletas/1/percentis',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('propaga o erro (incluindo 404) como Error com a mensagem do backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'dados insuficientes — atleta com poucos jogos' }),
      }),
    )

    await expect(buscarPercentisAtleta(2)).rejects.toThrow('dados insuficientes')
  })
})