import { apiGet } from './client'

export type Posicao = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA' | 'TEC'
export type MandoRodada = 'casa' | 'fora' | 'sem_jogo'

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
  rodada_atual: number | null
  mando_rodada: MandoRodada
  chance_pontuar_percentual: number | null
  chance_pontuar_classificacao: 'baixa' | 'media' | 'alta' | null
  media_basica: number
  overall_score: number | null
}

export interface FiltrosAtletas {
  nome?: string
  posicao?: Posicao[]
  clube_id?: number
  mando?: MandoRodada
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
  if (filtros.mando !== undefined) params.set('mando', filtros.mando)
  if (filtros.page !== undefined) params.set('page', String(filtros.page))
  if (filtros.page_size !== undefined) params.set('page_size', String(filtros.page_size))
  for (const posicao of filtros.posicao ?? []) {
    params.append('posicao', posicao)
  }

  const query = params.toString()
  return apiGet<Atleta[]>(`/atletas${query ? `?${query}` : ''}`)
}

// Maior page_size aceito pelo backend (ver validação `le=100` em
// backend/app/contexts/estatisticas/api/atletas.py).
const TAMANHO_MAX_PAGINA = 100

/**
 * Busca todos os atletas do banco, paginando internamente até a última
 * página. Dataset medido em ~857 atletas / ~285KB — cabe inteiro em
 * memória e carrega em <0.5s (9 páginas sequenciais); vira a base pro
 * cache local que filtro/ordenação/paginação usam no cliente, sem
 * round-trip ao backend a cada interação.
 */
export async function listarTodosAtletas(): Promise<Atleta[]> {
  const todos: Atleta[] = []
  let page = 1
  while (true) {
    const pagina = await listarAtletas({ page, page_size: TAMANHO_MAX_PAGINA })
    todos.push(...pagina)
    if (pagina.length < TAMANHO_MAX_PAGINA) break
    page += 1
  }
  return todos
}

export function buscarAtleta(id: number): Promise<Atleta> {
  return apiGet<Atleta>(`/atletas/${id}`)
}

export function buscarHistoricoAtleta(id: number, limit?: number): Promise<PartidaHistorico[]> {
  const query = limit !== undefined ? `?limit=${limit}` : ''
  return apiGet<PartidaHistorico[]>(`/atletas/${id}/historico${query}`)
}
