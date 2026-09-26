import { afterEach, describe, expect, it, vi } from 'vitest'
import { buscarCurvaValorizacao, buscarMpvAtleta } from './mpv'

const respostaOk = (corpo: unknown) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => corpo,
})

describe('api/mpv', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('busca o MPV tipado do atleta', async () => {
    const corpo = {
      mpv_estimado: 2,
      faixa_preco: { min: 1, max: 10 },
      coeficientes: { a: 0.5, b: -1 },
      amostras: 35,
      confiavel: true,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaOk(corpo)))

    await expect(buscarMpvAtleta(7)).resolves.toEqual(corpo)
    expect(fetch).toHaveBeenCalledWith(
      '/api/proxy/atletas/7/mpv',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('busca a curva inteira sem query string', async () => {
    const corpo = [{ rodada: 1, variacao_media: -0.8 }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaOk(corpo)))

    await expect(buscarCurvaValorizacao()).resolves.toEqual(corpo)
    expect(fetch).toHaveBeenCalledWith(
      '/api/proxy/mercado/curva-valorizacao',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('envia rodada_ate quando o filtro e informado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaOk([])))

    await buscarCurvaValorizacao(5)

    expect(fetch).toHaveBeenCalledWith(
      '/api/proxy/mercado/curva-valorizacao?rodada_ate=5',
      expect.any(Object),
    )
  })
})
