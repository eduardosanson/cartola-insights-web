import { apiGet } from './client'

export interface PercentisPadrao {
  atleta_id: number
  pontuacao_media: number
  participacao_gol: number
  desarme: number
  disciplina: number
}

export interface PercentisGol {
  atleta_id: number
  pontuacao_media: number
  defesas: number
  solidez_sg: number
  disciplina: number
}

export type PercentisAtleta = PercentisPadrao | PercentisGol

export function buscarPercentisAtleta(id: number): Promise<PercentisAtleta> {
  return apiGet<PercentisAtleta>(`/atletas/${id}/percentis`)
}

export function ehPercentisGol(percentis: PercentisAtleta): percentis is PercentisGol {
  return 'defesas' in percentis
}