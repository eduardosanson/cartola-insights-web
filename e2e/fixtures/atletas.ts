/**
 * Fixture mínima e determinística de atletas para o e2e da Listagem de
 * Jogadores. Evita depender de um backend real no CI (issue #6, RNF05) —
 * não é usada por nenhum código de produção.
 */
export interface AtletaFixture {
  id: number
  nome: string
  posicao: 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA' | 'TEC'
  clube_id: number
  clube_nome: string
  preco_atual: number
  media_geral: number
  media_casa: number
  media_fora: number
  rodada_atual: number | null
  mando_rodada: 'casa' | 'fora' | 'sem_jogo'
  chance_pontuar_percentual: number | null
  chance_pontuar_classificacao: 'baixa' | 'media' | 'alta' | null
  media_basica: number
  overall_score: number | null
  status_id: number | null
  status_nome: 'provavel' | 'duvida' | 'suspenso' | 'contundido' | 'nulo' | null
}

export const atletasFixture: AtletaFixture[] = [
  {
    id: 101,
    nome: 'Jogador Um da Silva',
    posicao: 'ATA',
    clube_id: 1,
    clube_nome: 'Clube Alfa',
    preco_atual: 12.5,
    media_geral: 6.4,
    media_casa: 7.1,
    media_fora: 5.6,
    rodada_atual: 20,
    mando_rodada: 'casa',
    chance_pontuar_percentual: 78,
    chance_pontuar_classificacao: 'alta',
    media_basica: 4.2,
    overall_score: 82,
    status_id: 7,
    status_nome: 'provavel',
  },
  {
    id: 102,
    nome: 'Jogador Dois Pereira',
    posicao: 'MEI',
    clube_id: 2,
    clube_nome: 'Clube Beta',
    preco_atual: 9.8,
    media_geral: 5.1,
    media_casa: 5.0,
    media_fora: 5.3,
    rodada_atual: 20,
    mando_rodada: 'fora',
    chance_pontuar_percentual: 54,
    chance_pontuar_classificacao: 'media',
    media_basica: 3.1,
    overall_score: 60,
    status_id: 7,
    status_nome: 'provavel',
  },
  {
    id: 103,
    nome: 'Jogador Três Souza',
    posicao: 'ZAG',
    clube_id: 3,
    clube_nome: 'Clube Gama',
    preco_atual: 6.3,
    media_geral: 3.2,
    media_casa: 3.0,
    media_fora: 3.5,
    rodada_atual: null,
    mando_rodada: 'sem_jogo',
    chance_pontuar_percentual: null,
    chance_pontuar_classificacao: null,
    media_basica: 2.8,
    overall_score: null,
    status_id: 5,
    status_nome: 'duvida',
  },
]
