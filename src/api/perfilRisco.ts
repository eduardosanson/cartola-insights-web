import { apiGet } from './client'

export type ClassificacaoRisco = 'baixo' | 'medio' | 'alto'

export interface PerfilRisco {
  atleta_id: number
  risco_percentual: number
  classificacao: ClassificacaoRisco
  pontos_retorno_direto: number
  pontos_participacao: number
}

export function buscarPerfilRiscoAtleta(id: number): Promise<PerfilRisco> {
  return apiGet<PerfilRisco>(`/atletas/${id}/perfil-risco`)
}
