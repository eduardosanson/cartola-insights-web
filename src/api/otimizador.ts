import { ApiError, apiGet, apiPost } from './client'
import type { Posicao } from './atletas'
import type { RaioXConfronto } from './raioX'

export type ModoOtimizacao = 'classica' | 'tiro_curto' | 'patrimonio'
export type EsquemaTatico = '4-3-3' | '3-4-3' | '4-4-2' | '3-5-2' | '5-3-2' | '5-4-1'

export type EsquemasDisponiveis = Record<EsquemaTatico, Record<Posicao, number>>

export interface AtletaEscalado {
  atleta_id: number
  posicao: Exclude<Posicao, 'TEC'>
  preco: number
  pontuacao_esperada: number
}

export interface TecnicoEscalado {
  atleta_id: number
  preco: number
}

export interface EscalacaoOtima {
  titulares: AtletaEscalado[]
  tecnico: TecnicoEscalado
  custo_total: number
  pontuacao_esperada_total: number
  esquema: EsquemaTatico
  modo: ModoOtimizacao
}

export interface ParametrosOtimizacao {
  orcamento: number
  esquema: EsquemaTatico
  modo: ModoOtimizacao
}

export interface CandidatoCapitao {
  atleta_id: number
  capitao_score: number
  media_geral: number
  chance_pontuar_percentual: number
  fator_confronto: number
  proximo_confronto: RaioXConfronto
}

export interface SubstitutoSugerido {
  atleta_id: number
  posicao: Exclude<Posicao, 'TEC'>
  preco: number
  score: number
  media_geral: number
  chance_pontuar_percentual: number
  fator_confronto: number
  proximo_confronto: RaioXConfronto
}

export class EscalacaoInviavelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EscalacaoInviavelError'
  }
}

export function buscarEsquemas(): Promise<EsquemasDisponiveis> {
  return apiGet<EsquemasDisponiveis>('/otimizador/esquemas')
}

export function montarEscalacao(parametros: ParametrosOtimizacao): Promise<EscalacaoOtima> {
  return apiPost<EscalacaoOtima>('/otimizador/escalar', parametros).catch((erro: unknown) => {
    if (erro instanceof ApiError && erro.status === 422) {
      throw new EscalacaoInviavelError(erro.message)
    }
    throw erro
  })
}

export function buscarMatrizCapitao(): Promise<CandidatoCapitao[]> {
  return apiGet<CandidatoCapitao[]>('/otimizador/matriz-capitao')
}

export function buscarSubstituto(atletaId: number): Promise<SubstitutoSugerido | null> {
  return apiGet<SubstitutoSugerido>(`/otimizador/substituto/${atletaId}`).catch(
    (erro: unknown) => {
      if (erro instanceof ApiError && erro.status === 404) return null
      throw erro
    },
  )
}
