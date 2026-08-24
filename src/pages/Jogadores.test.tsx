import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Jogadores from './Jogadores'
import * as atletasApi from '../api/atletas'

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
  chance_pontuar_percentual: null,
  chance_pontuar_classificacao: null,
  media_basica: 4.123,
}

function renderJogadores() {
  return render(
    <MemoryRouter>
      <Jogadores />
    </MemoryRouter>,
  )
}

describe('Jogadores', () => {
  beforeEach(() => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([atleta])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders all position chips, including TEC', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    for (const posicao of ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA', 'TEC']) {
      expect(screen.getByRole('button', { name: posicao })).toBeInTheDocument()
    }
  })

  it('renders atletas with clube/posicao/preco/médias once loaded', async () => {
    renderJogadores()

    expect(await screen.findByText('Gabigol')).toBeInTheDocument()
    expect(screen.getByText('Flamengo')).toBeInTheDocument()
    expect(screen.getByText('12,57')).toBeInTheDocument()
  })

  it('shows an error message when the API call fails', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockRejectedValue(new Error('Falha de rede'))

    renderJogadores()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('calls the API with the nome filter only after the 300ms debounce', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    const input = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(input, { target: { value: 'Gabi' } })

    // still just the initial mount call right after typing, debounce hasn't fired yet
    expect(atletasApi.listarAtletas).not.toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Gabi' }),
    )

    await waitFor(
      () =>
        expect(atletasApi.listarAtletas).toHaveBeenCalledWith(
          expect.objectContaining({ nome: 'Gabi' }),
        ),
      { timeout: 1000 },
    )
  })

  it('filters by position when a chip is clicked', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Gabigol')

    await user.click(screen.getByRole('button', { name: 'ATA' }))

    await waitFor(() =>
      expect(atletasApi.listarAtletas).toHaveBeenCalledWith(
        expect.objectContaining({ posicao: ['ATA'] }),
      ),
    )
  })

  it('removes an active position filter when the chip is clicked again', async () => {
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Gabigol')

    const chip = screen.getByRole('button', { name: 'ATA' })
    await user.click(chip)
    await user.click(chip)

    await waitFor(() =>
      expect(atletasApi.listarAtletas).toHaveBeenLastCalledWith(
        expect.objectContaining({ posicao: undefined }),
      ),
    )
  })

  it('shows an empty state when no athlete matches', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([])

    renderJogadores()

    expect(await screen.findByText(/nenhum jogador/i)).toBeInTheDocument()
  })

  it('navigates forward and backward through full pages', async () => {
    const paginaCheia = Array.from({ length: 20 }, (_, index) => ({
      ...atleta,
      id: index + 1,
      nome: `Jogador ${index + 1}`,
    }))
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue(paginaCheia)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Jogador 1')

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await waitFor(() =>
      expect(atletasApi.listarAtletas).toHaveBeenCalledWith(expect.objectContaining({ page: 2 })),
    )
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    await waitFor(() =>
      expect(atletasApi.listarAtletas).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 }),
      ),
    )
  })

  it('combines price and average sorting on the current page', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'A', preco_atual: 10, media_geral: 5 },
      { ...atleta, id: 2, nome: 'B', preco_atual: 12, media_geral: 4 },
      { ...atleta, id: 3, nome: 'C', preco_atual: 12, media_geral: 8 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('A')

    const preco = screen.getByRole('button', { name: /preço/i })
    const mediaGeral = screen.getByRole('button', { name: /média geral/i })
    await user.click(preco)
    await user.click(mediaGeral)

    expect(preco).toHaveTextContent('↓ 1')
    expect(mediaGeral).toHaveTextContent('↓ 2')
    expect(within(screen.getAllByRole('row')[1]).getByText('C')).toBeInTheDocument()
  })

  it('shows whether each athlete plays at home, away or has no match', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Mandante', mando_rodada: 'casa' },
      { ...atleta, id: 2, nome: 'Visitante', mando_rodada: 'fora' },
      { ...atleta, id: 3, nome: 'Sem Partida', mando_rodada: 'sem_jogo' },
    ])
    renderJogadores()
    await screen.findByText('Mandante')

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Casa')).toHaveStyle({ color: 'var(--accent-home)' })
    expect(within(rows[2]).getByText('Fora')).toHaveStyle({ color: 'var(--accent-away)' })
    expect(within(rows[3]).getByText('Sem jogo')).toBeInTheDocument()
  })

  it('filters by mando when a chip is clicked', async () => {
    const user = userEvent.setup()
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([atleta])
    renderJogadores()
    await screen.findByText('Gabigol')

    await user.click(screen.getByRole('button', { name: 'Casa' }))

    await waitFor(() => {
      expect(atletasApi.listarAtletas).toHaveBeenLastCalledWith(
        expect.objectContaining({ mando: 'casa' }),
      )
    })
  })

  it('does not render the Todos button in the mando filter group', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    const mandoGroup = screen.getByRole('group', { name: /mando/i })
    expect(within(mandoGroup).queryByRole('button', { name: 'Todos' })).not.toBeInTheDocument()
    expect(within(mandoGroup).getByRole('button', { name: 'Casa' })).toBeInTheDocument()
    expect(within(mandoGroup).getByRole('button', { name: 'Fora' })).toBeInTheDocument()
  })

  it('toggles off active mando filter when clicked again', async () => {
    const user = userEvent.setup()
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([atleta])
    renderJogadores()
    await screen.findByText('Gabigol')

    const casaBtn = screen.getByRole('button', { name: 'Casa' })
    await user.click(casaBtn)
    await waitFor(() => {
      expect(atletasApi.listarAtletas).toHaveBeenLastCalledWith(
        expect.objectContaining({ mando: 'casa' }),
      )
    })

    await user.click(casaBtn)
    await waitFor(() => {
      expect(atletasApi.listarAtletas).toHaveBeenLastCalledWith(
        expect.objectContaining({ mando: undefined }),
      )
    })
  })

  it('shows the chance de pontuar classification, and a dash when unknown', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Artilheiro', chance_pontuar_classificacao: 'alta' },
      { ...atleta, id: 2, nome: 'Reserva', chance_pontuar_classificacao: null },
    ])
    renderJogadores()
    await screen.findByText('Artilheiro')

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Alta')).toBeInTheDocument()
    expect(within(rows[2]).getByText('—')).toBeInTheDocument()
  })

  it('shows the media basica column', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    expect(screen.getByText('4,12')).toBeInTheDocument()
  })

  it('sorts by media basica when the column header is clicked', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'A', media_basica: 3 },
      { ...atleta, id: 2, nome: 'B', media_basica: 9 },
      { ...atleta, id: 3, nome: 'C', media_basica: 5 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('A')

    await user.click(screen.getByRole('button', { name: /média básica/i }))

    expect(within(screen.getAllByRole('row')[1]).getByText('B')).toBeInTheDocument()
  })

  it('sorts by chance de pontuar, with atletas sem dado ficando por ultimo', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Media', chance_pontuar_percentual: 80 },
      { ...atleta, id: 2, nome: 'SemDado', chance_pontuar_percentual: null },
      { ...atleta, id: 3, nome: 'Alta', chance_pontuar_percentual: 95 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Media')

    await user.click(screen.getByRole('button', { name: /chance de pontuar/i }))

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Alta')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Media')).toBeInTheDocument()
    expect(within(rows[3]).getByText('SemDado')).toBeInTheDocument()
  })

  it('sorts by media casa and media fora when header is clicked', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'A', media_casa: 3, media_fora: 8 },
      { ...atleta, id: 2, nome: 'B', media_casa: 9, media_fora: 2 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('A')

    const btnCasa = screen.getByRole('button', { name: /média casa/i })
    await user.click(btnCasa)
    expect(within(screen.getAllByRole('row')[1]).getByText('B')).toBeInTheDocument()

    // untoggle casa (click 2 more times: desc -> asc -> none)
    await user.click(btnCasa)
    await user.click(btnCasa)

    const btnFora = screen.getByRole('button', { name: /média fora/i })
    await user.click(btnFora)
    expect(within(screen.getAllByRole('row')[1]).getByText('A')).toBeInTheDocument()
  })

  it('renders each player row as a single link to the detail page, not just the name', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveAttribute('href', '/jogadores/1')
  })
})
