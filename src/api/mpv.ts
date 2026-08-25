import { apiGet } from './client'

export interface MpvAtleta {
  mpv_estimado: number | null
  faixa_preco: { min: number; max: number }
  coeficientes: { a: number; b: number }
  amostras: number
  confiavel: boolean
}

export interface PontoCurvaValorizacao {
  rodada: number
  variacao_media: number
}

export function buscarMpvAtleta(atletaId: number): Promise<MpvAtleta> {
  return apiGet<MpvAtleta>(`/atletas/${atletaId}/mpv`)
}

export function buscarCurvaValorizacao(
  rodadaAte?: number,
): Promise<PontoCurvaValorizacao[]> {
  const params = new URLSearchParams()
  if (rodadaAte !== undefined) params.set('rodada_ate', String(rodadaAte))
  const query = params.toString()
  return apiGet<PontoCurvaValorizacao[]>(`/mercado/curva-valorizacao${query ? `?${query}` : ''}`)
}
