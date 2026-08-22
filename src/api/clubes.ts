import { apiGet } from './client'

export interface Clube {
  id: number
  nome: string
  media_pontos_casa: number
  media_pontos_fora: number
}

export function listarClubes(): Promise<Clube[]> {
  return apiGet<Clube[]>('/clubes')
}
