import { describe, it, expect, vi, afterEach } from 'vitest'
import { buscarPerfilRiscoAtleta } from './perfilRisco'

describe('api/perfilRisco', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('busca GET /atletas/id/perfil-risco e retorna o corpo tipado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          atleta_id: 1,
          risco_percentual: 70.0,
          classificacao: 'alto',
          pontos_retorno_direto: 132.0,
          pontos_participacao: 56.5,
        }),
      }),
    )

    const resultado = await buscarPerfilRiscoAtleta(1)

    expect(resultado).toEqual({
      atleta_id: 1,
      risco_percentual: 70.0,
      classificacao: 'alto',
      pontos_retorno_direto: 132.0,
      pontos_participacao: 56.5,
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/atletas/1/perfil-risco',
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
        json: async () => ({
          detail: 'dados insuficientes - atleta com poucos jogos pra calcular perfil de risco',
        }),
      }),
    )

    await expect(buscarPerfilRiscoAtleta(2)).rejects.toThrow('dados insuficientes')
  })
})
