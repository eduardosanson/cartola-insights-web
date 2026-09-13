import { render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as atletasApi from '../api/atletas'
import * as api from '../api/otimizador'
import MatrizCapitao from './MatrizCapitao'

function renderizarStrict() {
  return render(
    <StrictMode>
      <MemoryRouter>
        <MatrizCapitao />
      </MemoryRouter>
    </StrictMode>,
  )
}

vi.mock('../components/RaioXConfronto', () => ({
  default: ({ raioX }: { raioX: { atleta_id: number } }) => (
    <div data-testid="raio-x">Confronto {raioX.atleta_id}</div>
  ),
}))

const confronto = (atletaId: number) => ({
  atleta_id: atletaId,
  posicao: 'ATA',
  rodada: 25,
  mando: 'casa' as const,
  clube_adversario_id: 2,
  clube_adversario_nome: 'Adversário',
  media_no_mando: 7,
  pontos_cedidos_adversario: 5,
  participacao_pontuacao_time_media: 20,
  veredito: 'referencia_do_time' as const,
})

const status = ['provavel', 'provavel', 'duvida', 'nulo', 'duvida'] as const
const statusId = [7, 7, 2, 6, 2]
const candidatos: api.CandidatoCapitao[] = [3, 1, 2, 5, 4].map((atletaId, indice) => ({
  atleta_id: atletaId,
  capitao_score: 20 - indice,
  media_geral: 7,
  chance_pontuar_percentual: 80,
  fator_confronto: 1.2,
  status_id: statusId[indice],
  status_nome: status[indice],
  proximo_confronto: confronto(atletaId),
}))

describe('MatrizCapitao', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(api, 'buscarMatrizCapitao').mockResolvedValue(candidatos)
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation(async (id) => ({
      id,
      nome: `Atleta ${id}`,
    }) as atletasApi.Atleta)
  })

  it('preserva a ordem do top 5, destaca o primeiro e reaproveita o raio-X', async () => {
    render(
      <MemoryRouter>
        <MatrizCapitao />
      </MemoryRouter>,
    )

    const links = await screen.findAllByRole('link', { name: /atleta \d/i })
    expect(links.map((link) => link.textContent)).toEqual([
      'Atleta 3',
      'Atleta 1',
      'Atleta 2',
      'Atleta 5',
      'Atleta 4',
    ])
    expect(screen.getByText('1º lugar')).toBeInTheDocument()
    expect(screen.getByText(/prováveis primeiro/i)).toBeInTheDocument()
    expect(screen.getAllByText('Provável')).toHaveLength(2)
    expect(screen.getAllByText('Dúvida')).toHaveLength(2)
    expect(screen.getByText('Nulo')).toBeInTheDocument()
    expect(screen.getAllByTestId('raio-x')).toHaveLength(5)
    await waitFor(() => expect(api.buscarMatrizCapitao).toHaveBeenCalledTimes(1))

    expect(screen.queryByText('Calculando candidatos…')).not.toBeInTheDocument()
    expect(screen.queryByText(/nenhum candidato a capitão disponível/i)).not.toBeInTheDocument()

    const itens = screen.getAllByRole('listitem')
    expect(itens[0]).toHaveClass('capitao-destaque')
    itens.slice(1).forEach((item) => expect(item).not.toHaveClass('capitao-destaque'))
  })

  it('mostra o estado de carregamento enquanto a matriz ainda não respondeu', () => {
    vi.mocked(api.buscarMatrizCapitao).mockReturnValue(new Promise(() => {}))
    render(
      <MemoryRouter>
        <MatrizCapitao />
      </MemoryRouter>,
    )

    expect(screen.getByText('Calculando candidatos…')).toBeInTheDocument()
    expect(screen.queryByText(/nenhum candidato a capitão disponível/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra estado vazio sem inventar candidatos', async () => {
    vi.mocked(api.buscarMatrizCapitao).mockResolvedValue([])
    render(
      <MemoryRouter>
        <MatrizCapitao />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/nenhum candidato a capitão disponível/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('mantém o candidato navegável quando o nome falha e mostra erros da matriz', async () => {
    vi.mocked(api.buscarMatrizCapitao)
      .mockResolvedValueOnce([candidatos[0]])
      .mockRejectedValueOnce(new Error('Matriz indisponível'))
    vi.mocked(atletasApi.buscarAtleta).mockRejectedValue(new Error('Atleta indisponível'))
    const primeira = render(
      <MemoryRouter>
        <MatrizCapitao />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: 'Atleta #3' })).toHaveAttribute(
      'href',
      '/jogadores/3',
    )
    primeira.unmount()
    render(
      <MemoryRouter>
        <MatrizCapitao />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Matriz indisponível')
  })

  it('ignora a resolução tardia de um efeito de busca de candidatos já cancelado (StrictMode)', async () => {
    const candidatoObsoleto: api.CandidatoCapitao = {
      ...candidatos[0],
      atleta_id: 999,
    }
    let chamadas = 0
    let resolverObsoleto: (value: api.CandidatoCapitao[]) => void = () => {}
    vi.mocked(api.buscarMatrizCapitao).mockImplementation(() => {
      chamadas += 1
      if (chamadas === 1) {
        return new Promise((resolve) => {
          resolverObsoleto = resolve
        })
      }
      return Promise.resolve(candidatos)
    })

    renderizarStrict()

    const links = await screen.findAllByRole('link', { name: /atleta \d/i })
    expect(links).toHaveLength(5)

    // resolve tardiamente o efeito já cancelado pelo cleanup do StrictMode
    resolverObsoleto([candidatoObsoleto])
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.getAllByRole('link', { name: /atleta \d/i })).toHaveLength(5)
    expect(screen.queryByText('Atleta 999')).not.toBeInTheDocument()
  })

  it('ignora a rejeição tardia de um efeito de busca de candidatos já cancelado (StrictMode)', async () => {
    let chamadas = 0
    let rejeitarObsoleto: (err: Error) => void = () => {}
    vi.mocked(api.buscarMatrizCapitao).mockImplementation(() => {
      chamadas += 1
      if (chamadas === 1) {
        return new Promise((_resolve, reject) => {
          rejeitarObsoleto = reject
        })
      }
      return Promise.resolve(candidatos)
    })

    renderizarStrict()

    const links = await screen.findAllByRole('link', { name: /atleta \d/i })
    expect(links).toHaveLength(5)

    // rejeita tardiamente o efeito já cancelado pelo cleanup do StrictMode
    rejeitarObsoleto(new Error('efeito obsoleto'))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /atleta \d/i })).toHaveLength(5)
  })
})
