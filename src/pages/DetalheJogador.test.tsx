import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DetalheJogador from './DetalheJogador'
import * as atletasApi from '../api/atletas'
import * as percentisApi from '../api/percentis'

const atleta = {
  id: 1,
  nome: 'Gabigol',
  posicao: 'ATA' as const,
  clube_id: 5,
  clube_nome: 'Flamengo',
  preco_atual: 12.567,
  media_geral: 6.234,
  media_casa: 7.156,
  media_fora: 5.345,
  rodada_atual: 24,
  mando_rodada: 'casa' as const,
}

const partida = {
  rodada: 3,
  clube_adversario_id: 2,
  clube_adversario_nome: 'Vasco',
  mando: 'casa' as const,
  pontos_total: 8.567,
  scouts: { G: 1, FT: 2 },
}

function renderDetalhe(id = '1', state: unknown = { atleta }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/jogadores/${id}`, state }]}>
      <Routes>
        <Route path="/jogadores/:id" element={<DetalheJogador />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DetalheJogador', () => {
  beforeEach(() => {
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue({
      atleta_id: 1,
      pontuacao_media: 80,
      participacao_gol: 91,
      desarme: 40,
      disciplina: 65,
    })
  })

  it('loads atleta and histórico from the API on a direct access', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])

    renderDetalhe('1', null)

    expect(atletasApi.buscarAtleta).toHaveBeenCalledWith(1)
    expect(atletasApi.buscarHistoricoAtleta).toHaveBeenCalledWith(1)
    expect(await screen.findByRole('heading', { name: 'Gabigol' })).toBeInTheDocument()
    expect(screen.getByText('6,23')).toBeInTheDocument()
    expect(screen.getByText('7,16')).toBeInTheDocument()
    expect(screen.getByText('5,35')).toBeInTheDocument()
    expect(screen.getByText('Rodada 24 · Casa')).toBeInTheDocument()
    expect(await screen.findByText('Vasco')).toBeInTheDocument()
    expect(screen.getByText('8,57')).toBeInTheDocument()
    expect(screen.getByText('casa')).toBeInTheDocument()
  })

  it('shows a loading state before the histórico resolves', () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockReturnValue(new Promise(() => {}))
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockReturnValue(new Promise(() => {}))

    renderDetalhe()

    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('shows an error message when the histórico fetch fails', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockRejectedValue(new Error('Falha de rede'))

    renderDetalhe()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('shows an empty state when the athlete has no history', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([])

    renderDetalhe('1', null)

    expect(await screen.findByText(/sem histórico/i)).toBeInTheDocument()
  })

  it('renders an away match with its scouts', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([
      { ...partida, mando: 'fora', scouts: {} },
    ])

    renderDetalhe('1', null)

    expect(await screen.findByText('fora')).toBeInTheDocument()
  })

  it('ignores late responses after unmount', () => {
    let resolver: ((value: typeof atleta) => void) | undefined
    vi.spyOn(atletasApi, 'buscarAtleta').mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve
      }),
    )
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([])

    const view = renderDetalhe('1', null)
    view.unmount()
    resolver?.(atleta)

    expect(view.container).toBeEmptyDOMElement()
  })

  it('shows when the athlete has no match in the current round', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue({
      ...atleta,
      mando_rodada: 'sem_jogo',
    })
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([])

    renderDetalhe('1', null)

    expect(await screen.findByText('Sem jogo na rodada 24')).toBeInTheDocument()
  })

  it('mostra o radar quando os percentis carregam com sucesso', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])
    vi.mocked(percentisApi.buscarPercentisAtleta).mockResolvedValue({
      atleta_id: 1,
      pontuacao_media: 80,
      participacao_gol: 91,
      desarme: 40,
      disciplina: 65,
    })

    renderDetalhe('1', null)

    expect(await screen.findByText('Participação em gol')).toBeInTheDocument()
    expect(screen.getByText('Desarme')).toBeInTheDocument()
    expect(screen.getByText('Disciplina')).toBeInTheDocument()
  })

  it('mostra a mensagem de erro no lugar do radar quando o percentil da 404', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])
    vi.mocked(percentisApi.buscarPercentisAtleta).mockRejectedValue(
      new Error('dados insuficientes — atleta com poucos jogos'),
    )

    renderDetalhe('1', null)

    expect(await screen.findByText(/dados insuficientes/i)).toBeInTheDocument()
    // a página não quebra: o histórico continua aparecendo normalmente
    expect(await screen.findByText('Vasco')).toBeInTheDocument()
  })
})
