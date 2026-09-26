import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EscalacaoInviavelError,
  buscarEsquemas,
  buscarMatrizCapitao,
  buscarSubstituto,
  montarEscalacao,
} from './otimizador'

afterEach(() => vi.restoreAllMocks())

describe('API do otimizador', () => {
  it('busca os esquemas oficiais', async () => {
    const esquemas = { '4-3-3': { GOL: 1, ZAG: 2, LAT: 2, MEI: 3, ATA: 3, TEC: 1 } }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(esquemas), { status: 200 }),
    )

    await expect(buscarEsquemas()).resolves.toEqual(esquemas)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/proxy/otimizador/esquemas',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('envia orçamento, esquema e modo para montar a escalação', async () => {
    const escalacao = {
      titulares: [],
      tecnico: { atleta_id: 12, preco: 4 },
      custo_total: 84,
      pontuacao_esperada_total: 62,
      esquema: '4-3-3',
      modo: 'classica',
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(escalacao), { status: 200 }),
    )

    await expect(
      montarEscalacao({ orcamento: 100, esquema: '4-3-3', modo: 'classica' }),
    ).resolves.toEqual(escalacao)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/proxy/otimizador/escalar',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ orcamento: 100, esquema: '4-3-3', modo: 'classica' }),
      }),
    )
  })

  it('transforma resposta 422 em erro de escalação inviável', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'não há escalação viável' }), {
        status: 422,
        statusText: 'Unprocessable Entity',
      }),
    )

    const promise = montarEscalacao({ orcamento: 10, esquema: '4-3-3', modo: 'classica' })
    await expect(promise).rejects.toBeInstanceOf(EscalacaoInviavelError)
    await expect(promise).rejects.toMatchObject({
      name: 'EscalacaoInviavelError',
      message: 'não há escalação viável',
    })
  })

  it('mantém o erro original quando a API responde com status diferente de 422', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'falha ao montar escalação' }), {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    )

    const promise = montarEscalacao({ orcamento: 10, esquema: '4-3-3', modo: 'classica' })
    await expect(promise).rejects.not.toBeInstanceOf(EscalacaoInviavelError)
    await expect(promise).rejects.toThrow('falha ao montar escalação')
  })

  it('busca a matriz de capitão sem reordenar o top retornado', async () => {
    const candidatos = [{ atleta_id: 9 }, { atleta_id: 3 }]
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(candidatos), { status: 200 }),
    )

    await expect(buscarMatrizCapitao()).resolves.toEqual(candidatos)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/proxy/otimizador/matriz-capitao',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('busca substituto sob demanda e converte 404 em ausência válida', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'sem substituto' }), { status: 404 }),
    )

    await expect(buscarSubstituto(42)).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/proxy/otimizador/substituto/42',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('preserva erros não tratados de escalação e substituição', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'falha interna' }), { status: 500 }),
      )

    await expect(
      montarEscalacao({ orcamento: 100, esquema: '4-3-3', modo: 'classica' }),
    ).rejects.toThrow('offline')
    await expect(buscarSubstituto(42)).rejects.toThrow('falha interna')
  })
})
