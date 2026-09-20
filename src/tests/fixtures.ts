import type { Atleta } from '../api/atletas'
import type { PercentisPadrao } from '../api/percentis'

export const atletaMock: Atleta = {
  id: 1,
  nome: 'Gabigol',
  posicao: 'ATA',
  clube_id: 5,
  clube_nome: 'Flamengo',
  preco_atual: 12.5,
  media_geral: 6.2,
  media_casa: 7.1,
  media_fora: 5.3,
  rodada_atual: 24,
  mando_rodada: 'casa',
  chance_pontuar_percentual: null,
  chance_pontuar_classificacao: null,
  media_basica: 4.1,
  overall_score: 69.3,
} as Atleta

export const percentisMock: PercentisPadrao = {
  atleta_id: 1,
  pontuacao_media: 94,
  participacao_gol: 78,
  desarme: 62,
  disciplina: 68,
  media_basica: 85,
  brutos: {
    pontuacao_media: 8.45,
    participacao_gol: 0.65,
    desarme: 1.8,
    disciplina: 0.85,
    media_basica: 5.2,
  },
  mediana_posicao: {
    pontuacao_media: 4.1,
    participacao_gol: 0.2,
    desarme: 1.1,
    disciplina: 0.5,
    media_basica: 2.8,
  },
  overall_score: 77.4,
}
