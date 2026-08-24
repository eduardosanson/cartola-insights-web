import { describe, it, expect, vi, afterEach } from 'vitest'
import { buscarRaioXConfronto } from './raioX'

describe('api/raioX', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('busca GET /atletas/id/raio-x e retorna o corpo tipado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          atleta_id: 1,
          posicao: 'ATA',
          rodada: 24,
          mando: 'casa',
          clube_adversario_id: 267,
          clube_adversario_nome: 'Vasco',
          media_no_mando: 7.15,
          pontos_cedidos_adversario: 4.89,
          participacao_pontuacao_time_media: 12.4,
          veredito: 'referencia_do_time',
        }),
      }),
    )

    const resultado = await buscarRaioXConfronto(1)

    expect(resultado).toEqual({
      atleta_id: 1,
      posicao: 'ATA',
      rodada: 24,
      mando: 'casa',
      clube_adversario_id: 267,
      clube_adversario_nome: 'Vasco',
      media_no_mando: 7.15,
      pontos_cedidos_adversario: 4.89,
      participacao_pontuacao_time_media: 12.4,
      veredito: 'referencia_do_time',
    })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/atletas/1/raio-x',
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
        json: async () => ({ detail: 'raio-x nao disponivel para tecnico' }),
      }),
    )

    await expect(buscarRaioXConfronto(2)).rejects.toThrow('raio-x nao disponivel')
  })
})
