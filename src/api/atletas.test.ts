import { describe, it, expect, vi } from 'vitest'
import { buscarAtleta, buscarHistoricoAtleta, listarAtletas, listarTodosAtletas } from './atletas'
import * as client from './client'

function atletaFake(id: number) {
  return {
    id,
    nome: `Atleta ${id}`,
    posicao: 'ATA' as const,
    clube_id: 1,
    clube_nome: 'CLB',
    preco_atual: 5,
    media_geral: 5,
    media_casa: 5,
    media_fora: 5,
    rodada_atual: 1,
    mando_rodada: 'casa' as const,
    chance_pontuar_percentual: null,
    chance_pontuar_classificacao: null,
    media_basica: 5,
    overall_score: null,
  }
}

describe('listarAtletas', () => {
  it('calls GET /atletas with no query params by default', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet').mockResolvedValue([])

    await listarAtletas()

    expect(apiGetSpy).toHaveBeenCalledWith('/atletas')
  })

  it('builds query params for nome, clube_id, page and page_size', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet').mockResolvedValue([])

    await listarAtletas({ nome: 'Gabigol', clube_id: 5, page: 2, page_size: 20 })

    const calledPath = apiGetSpy.mock.calls[0][0] as string
    const url = new URLSearchParams(calledPath.split('?')[1])
    expect(url.get('nome')).toBe('Gabigol')
    expect(url.get('clube_id')).toBe('5')
    expect(url.get('page')).toBe('2')
    expect(url.get('page_size')).toBe('20')
  })

  it('repeats the posicao param for each selected position', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet').mockResolvedValue([])

    await listarAtletas({ posicao: ['GOL', 'ATA'] })

    const calledPath = apiGetSpy.mock.calls[0][0] as string
    const url = new URLSearchParams(calledPath.split('?')[1])
    expect(url.getAll('posicao')).toEqual(['GOL', 'ATA'])
  })

  it('returns the list from the API', async () => {
    const atleta = {
      id: 1,
      nome: 'Gabigol',
      posicao: 'ATA' as const,
      clube_id: 5,
      clube_nome: 'Flamengo',
      preco_atual: 12.5,
      media_geral: 6.2,
      media_casa: 7.1,
      media_fora: 5.3,
    }
    vi.spyOn(client, 'apiGet').mockResolvedValue([atleta])

    const result = await listarAtletas()

    expect(result).toEqual([atleta])
  })
})

describe('listarTodosAtletas', () => {
  it('busca todas as páginas (100 por vez) até uma página incompleta', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet')
    apiGetSpy.mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => atletaFake(i)))
    apiGetSpy.mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => atletaFake(100 + i)))
    apiGetSpy.mockResolvedValueOnce(Array.from({ length: 57 }, (_, i) => atletaFake(200 + i)))

    const resultado = await listarTodosAtletas()

    expect(apiGetSpy).toHaveBeenCalledTimes(3)
    expect(apiGetSpy).toHaveBeenNthCalledWith(1, '/atletas?page=1&page_size=100')
    expect(apiGetSpy).toHaveBeenNthCalledWith(2, '/atletas?page=2&page_size=100')
    expect(apiGetSpy).toHaveBeenNthCalledWith(3, '/atletas?page=3&page_size=100')
    expect(resultado).toHaveLength(257)
  })

  it('para na primeira página quando ela já vem incompleta', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet')
    apiGetSpy.mockResolvedValueOnce(Array.from({ length: 5 }, (_, i) => atletaFake(i)))

    const resultado = await listarTodosAtletas()

    expect(apiGetSpy).toHaveBeenCalledTimes(1)
    expect(resultado).toHaveLength(5)
  })
})

describe('buscarAtleta', () => {
  it('calls GET /atletas/{id}', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet').mockResolvedValue({})

    await buscarAtleta(7)

    expect(apiGetSpy).toHaveBeenCalledWith('/atletas/7')
  })
})

describe('buscarHistoricoAtleta', () => {
  it('calls GET /atletas/{id}/historico without limit by default', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet').mockResolvedValue([])

    await buscarHistoricoAtleta(7)

    expect(apiGetSpy).toHaveBeenCalledWith('/atletas/7/historico')
  })

  it('appends limit when provided', async () => {
    const apiGetSpy = vi.spyOn(client, 'apiGet').mockResolvedValue([])

    await buscarHistoricoAtleta(7, 10)

    expect(apiGetSpy).toHaveBeenCalledWith('/atletas/7/historico?limit=10')
  })

  it('returns the history list from the API', async () => {
    const partida = {
      rodada: 1,
      clube_adversario_id: 2,
      clube_adversario_nome: 'Vasco',
      mando: 'casa' as const,
      pontos_total: 8.5,
      scouts: { G: 1, FT: 2 },
    }
    vi.spyOn(client, 'apiGet').mockResolvedValue([partida])

    const result = await buscarHistoricoAtleta(7)

    expect(result).toEqual([partida])
  })
})
