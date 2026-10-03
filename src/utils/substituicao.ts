import type { DetalhesAtletaCampo } from '../components/CampoTatico'
import type { EscalacaoOtima, SubstitutoSugerido } from '../api/otimizador'
import { formatCurrency } from './formatNumber'

export interface ResultadoCompleto {
  escalacao: EscalacaoOtima
  detalhes: Record<number, DetalhesAtletaCampo>
  orcamento: number
}

export type PlanoSubstituicao = { resultado: ResultadoCompleto; aviso?: string } | { erro: string }

/**
 * Troca um titular pelo substituto sugerido e recalcula custo e pontuação.
 * O substituto não traz pontuação esperada do otimizador; usa-se a média geral dele.
 * Se a troca ultrapassar o orçamento, ela é permitida e o orçamento é ajustado ao novo custo.
 */
export function aplicarSubstituicao(
  atual: ResultadoCompleto,
  atletaId: number,
  substituto: SubstitutoSugerido,
  detalhesNovo: DetalhesAtletaCampo,
): PlanoSubstituicao {
  const { escalacao } = atual
  const antigo = escalacao.titulares.find((atleta) => atleta.atleta_id === atletaId)
  if (!antigo) return { erro: 'O atleta não está mais na escalação.' }
  if (escalacao.titulares.some((atleta) => atleta.atleta_id === substituto.atleta_id)) {
    return { erro: 'O substituto sugerido já está na escalação.' }
  }
  if (substituto.posicao !== antigo.posicao) {
    return { erro: 'O substituto sugerido joga em outra posição.' }
  }
  const custoTotal = escalacao.custo_total - antigo.preco + substituto.preco
  const estoura = custoTotal > atual.orcamento
  const orcamento = estoura ? Math.round(custoTotal * 100) / 100 : atual.orcamento
  const titulares = escalacao.titulares.map((atleta) =>
    atleta.atleta_id === atletaId
      ? {
          atleta_id: substituto.atleta_id,
          posicao: antigo.posicao,
          preco: substituto.preco,
          pontuacao_esperada: substituto.media_geral,
        }
      : atleta,
  )
  return {
    aviso: estoura
      ? `A troca ultrapassa o orçamento de ${formatCurrency(atual.orcamento)}; o orçamento será ajustado para ${formatCurrency(orcamento)}.`
      : undefined,
    resultado: {
      orcamento,
      detalhes: { ...atual.detalhes, [substituto.atleta_id]: detalhesNovo },
      escalacao: {
        ...escalacao,
        titulares,
        custo_total: custoTotal,
        pontuacao_esperada_total:
          escalacao.pontuacao_esperada_total - antigo.pontuacao_esperada + substituto.media_geral,
      },
    },
  }
}
