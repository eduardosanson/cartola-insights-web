import type { DetalhesAtletaCampo } from '../components/CampoTatico'
import type { Atleta } from '../api/atletas'
import type { EscalacaoOtima } from '../api/otimizador'
import { formatCurrency } from './formatNumber'

export interface ResultadoCompleto {
  escalacao: EscalacaoOtima
  detalhes: Record<number, DetalhesAtletaCampo>
  orcamento: number
}

/** Sugestão de troca: vem do backend ou do ranking de atletas quando o sugerido já está no time. */
export interface SugestaoTroca {
  atleta_id: number
  posicao: string
  preco: number
  media_geral: number
  chance_pontuar_percentual: number | null
}

export type PlanoSubstituicao = { resultado: ResultadoCompleto; aviso?: string } | { erro: string }

/**
 * Troca um titular pelo substituto sugerido e recalcula custo e pontuação.
 * O substituto não traz pontuação esperada do otimizador; usa-se a média geral dele.
 * Se a troca ultrapassar o orçamento, ela é permitida: o orçamento original é mantido e o
 * excedente é exibido.
 */
export function aplicarSubstituicao(
  atual: ResultadoCompleto,
  atletaId: number,
  substituto: SugestaoTroca,
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
  const excesso = Math.round((custoTotal - atual.orcamento) * 100) / 100
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
    aviso:
      excesso > 0
        ? `A troca ultrapassa o orçamento em ${formatCurrency(excesso)}.`
        : undefined,
    resultado: {
      orcamento: atual.orcamento,
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

/**
 * Escolhe a melhor alternativa de um ranking já ordenado: ignora quem já está escalado
 * e quem custa mais que o atleta substituído.
 */
export function escolherAlternativa(
  candidatos: Atleta[],
  titularesIds: number[],
  precoMaximo: number,
): SugestaoTroca | null {
  const candidato = candidatos.find(
    (atleta) => !titularesIds.includes(atleta.id) && atleta.preco_atual <= precoMaximo,
  )
  if (!candidato) return null
  return {
    atleta_id: candidato.id,
    posicao: candidato.posicao,
    preco: candidato.preco_atual,
    media_geral: candidato.media_geral,
    chance_pontuar_percentual: candidato.chance_pontuar_percentual,
  }
}
