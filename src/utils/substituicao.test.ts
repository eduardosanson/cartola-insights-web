import { describe, expect, it } from 'vitest'
import type { SubstitutoSugerido } from '../api/otimizador'
import { aplicarSubstituicao, type ResultadoCompleto } from './substituicao'

const atual: ResultadoCompleto = {
  orcamento: 50,
  detalhes: { 1: { nome: 'Goleiro' }, 2: { nome: 'Atacante' } },
  escalacao: {
    titulares: [
      { atleta_id: 1, posicao: 'GOL', preco: 8, pontuacao_esperada: 5 },
      { atleta_id: 2, posicao: 'ATA', preco: 10, pontuacao_esperada: 7 },
    ],
    tecnico: { atleta_id: 9, preco: 4 },
    custo_total: 22,
    pontuacao_esperada_total: 12,
    esquema: '4-3-3',
    modo: 'classica',
  },
}

const substituto = (extra: Partial<SubstitutoSugerido> = {}): SubstitutoSugerido => ({
  atleta_id: 3,
  posicao: 'ATA',
  preco: 12,
  score: 1,
  media_geral: 8,
  chance_pontuar_percentual: 60,
  fator_confronto: 1,
  proximo_confronto: {} as SubstitutoSugerido['proximo_confronto'],
  ...extra,
})

describe('aplicarSubstituicao', () => {
  it('troca o titular e recalcula custo, pontuação e detalhes', () => {
    const plano = aplicarSubstituicao(atual, 2, substituto(), { nome: 'Novo' })
    expect(plano).toHaveProperty('resultado')
    if (!('resultado' in plano)) return
    const { escalacao, detalhes } = plano.resultado
    expect(escalacao.titulares[1]).toEqual({
      atleta_id: 3,
      posicao: 'ATA',
      preco: 12,
      pontuacao_esperada: 8,
    })
    expect(escalacao.custo_total).toBe(24)
    expect(escalacao.pontuacao_esperada_total).toBe(13)
    expect(detalhes[3]).toEqual({ nome: 'Novo' })
  })

  it('recusa quando o atleta não está na escalação', () => {
    expect(aplicarSubstituicao(atual, 99, substituto(), { nome: 'x' })).toEqual({
      erro: 'O atleta não está mais na escalação.',
    })
  })

  it('recusa substituto que já está na escalação', () => {
    expect(aplicarSubstituicao(atual, 2, substituto({ atleta_id: 1 }), { nome: 'x' })).toEqual({
      erro: 'O substituto sugerido já está na escalação.',
    })
  })

  it('recusa substituto de outra posição', () => {
    expect(aplicarSubstituicao(atual, 2, substituto({ posicao: 'MEI' }), { nome: 'x' })).toEqual({
      erro: 'O substituto sugerido joga em outra posição.',
    })
  })

  it('permite troca acima do orçamento, avisa e ajusta o orçamento ao novo custo', () => {
    const plano = aplicarSubstituicao(atual, 2, substituto({ preco: 40 }), { nome: 'x' })
    expect(plano).toHaveProperty('resultado')
    if (!('resultado' in plano)) return
    expect(plano.resultado.escalacao.custo_total).toBe(52)
    expect(plano.resultado.orcamento).toBe(52)
    expect(plano.aviso).toMatch(/ultrapassa o orçamento/)
  })

  it('não avisa nem altera o orçamento quando a troca cabe nele', () => {
    const plano = aplicarSubstituicao(atual, 2, substituto(), { nome: 'x' })
    expect('resultado' in plano && plano.aviso).toBeUndefined()
    expect('resultado' in plano && plano.resultado.orcamento).toBe(50)
  })
})
