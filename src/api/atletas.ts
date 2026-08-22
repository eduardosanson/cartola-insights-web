import { apiGet } from './client'

export type Posicao = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA'

export interface Atleta {
  id: number
  nome: string
  posicao: Posicao
  clube_id: number
  clube_nome: string
  preco_atual: number
  media_geral: number
  media_casa: number
  media_fora: number
}

export interface FiltrosAtletas {
  nome?: string
  posicao?: Posicao[]
  clube_id?: number
  page?: number
  page_size?: number
}

export type Mando = 'casa' | 'fora'

export interface PartidaHistorico {
  rodada: number
  clube_adversario_id: number
  clube_adversario_nome: string
  mando: Mando
  pontos_total: number
  scouts: Record<string, number>
}

export function listarAtletas(filtros: FiltrosAtletas = {}): Promise<Atleta[]> {
  const params = new URLSearchParams()
  if (filtros.nome) params.set('nome', filtros.nome)
  if (filtros.clube_id !== undefined) params.set('clube_id', String(filtros.clube_id))
  if (filtros.page !== undefined) params.set('page', String(filtros.page))
  if (filtros.page_size !== undefined) params.set('page_size', String(filtros.page_size))
  for (const posicao of filtros.posicao ?? []) {
    params.append('posicao', posicao)
  }

  const query = params.toString()
  return apiGet<Atleta[]>(`/atletas${query ? `?${query}` : ''}`)
}

export function buscarHistoricoAtleta(id: number, limit?: number): Promise<PartidaHistorico[]> {
  const query = limit !== undefined ? `?limit=${limit}` : ''
  return apiGet<PartidaHistorico[]>(`/atletas/${id}/historico${query}`)
}
