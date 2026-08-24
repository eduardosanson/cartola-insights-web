import { apiGet } from './client'

export interface ValoresBrutos {
  pontuacao_media: number
  indicador2?: number
  indicador3?: number
  participacao_gol?: number
  desarme?: number
  defesas?: number
  solidez_sg?: number
  disciplina: number
  media_basica: number
}

export interface PercentisPadrao {
  atleta_id: number
  pontuacao_media: number
  participacao_gol: number
  desarme: number
  disciplina: number
  media_basica: number
  brutos?: ValoresBrutos
  mediana_posicao?: ValoresBrutos
  overall_score?: number
}

export interface PercentisGol {
  atleta_id: number
  pontuacao_media: number
  defesas: number
  solidez_sg: number
  disciplina: number
  media_basica: number
  brutos?: ValoresBrutos
  mediana_posicao?: ValoresBrutos
  overall_score?: number
}

export type PercentisAtleta = PercentisPadrao | PercentisGol

export function ehPercentisGol(p: PercentisAtleta): p is PercentisGol {
  return 'defesas' in p
}

export async function buscarPercentisAtleta(id: number): Promise<PercentisAtleta> {
  return apiGet<PercentisAtleta>(`/atletas/${id}/percentis`)
}
