import { apiGet } from './client'
import type { Mando } from './atletas'

export type Veredito = 'referencia_do_time' | 'contribuicao_dividida' | 'pontuacao_diluida'

export interface RaioXConfronto {
  atleta_id: number
  posicao: string
  rodada: number
  mando: Mando
  clube_adversario_id: number
  clube_adversario_nome: string
  media_no_mando: number
  pontos_cedidos_adversario: number | null
  participacao_pontuacao_time_media: number | null
  veredito: Veredito | null
}

export function buscarRaioXConfronto(id: number): Promise<RaioXConfronto> {
  return apiGet<RaioXConfronto>(`/atletas/${id}/raio-x`)
}
