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
  overall_score: 69.3,
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
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([atleta])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('busca todos os atletas uma única vez ao montar (cache local)', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    expect(atletasApi.listarTodosAtletas).toHaveBeenCalledTimes(1)
    expect(atletasApi.listarTodosAtletas).toHaveBeenCalledWith()
  })

  it('renders all position options in position dropdown', async () => {
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Gabigol')

    await user.click(screen.getByRole('button', { name: /Posição/i }))

    for (const posicao of ['Goleiro (GOL)', 'Zagueiro (ZAG)', 'Lateral (LAT)', 'Meia (MEI)', 'Atacante (ATA)', 'Técnico (TEC)']) {
      expect(screen.getByText(posicao)).toBeInTheDocument()
    }
  })

  it('renders atletas with clube/posicao/preco/médias once loaded', async () => {
    renderJogadores()

    expect(await screen.findByText('Gabigol')).toBeInTheDocument()
    expect(screen.getByText('Flamengo')).toBeInTheDocument()
    expect(screen.getByText('12,57')).toBeInTheDocument()
  })

  it('shows an error message when the API call fails', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockRejectedValue(new Error('Falha de rede'))

    renderJogadores()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('filters by nome (client-side, sem nova chamada à API) após o debounce de 300ms', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Gabigol' },
      { ...atleta, id: 2, nome: 'Pedro' },
    ])
    renderJogadores()
    await screen.findByText('Gabigol')

    const input = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(input, { target: { value: 'Gabi' } })

    // ainda não filtrou — debounce não disparou
    expect(screen.getByText('Pedro')).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText('Pedro')).not.toBeInTheDocument(), {
      timeout: 1000,
    })
    expect(screen.getByText('Gabigol')).toBeInTheDocument()
    // nenhuma nova busca ao backend — filtro roda sobre o cache já carregado
    expect(atletasApi.listarTodosAtletas).toHaveBeenCalledTimes(1)
  })

  it('sanitiza HTML digitado no campo de busca antes de armazenar (issue #10)', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    const input = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(input, { target: { value: '<img src=x onerror=alert(1)>Gabi' } })

    expect((input as HTMLInputElement).value).toBe('Gabi')
  })

  it('filters by position when an option is clicked in position dropdown (client-side)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Atacante', posicao: 'ATA' },
      { ...atleta, id: 2, nome: 'Goleiro', posicao: 'GOL' },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Atacante')

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Atacante (ATA)'))

    expect(screen.getByText('Atacante')).toBeInTheDocument()
    expect(screen.queryByText('Goleiro')).not.toBeInTheDocument()
    expect(atletasApi.listarTodosAtletas).toHaveBeenCalledTimes(1)
  })

  it('removes an active position filter when the option is clicked again', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Atacante', posicao: 'ATA' },
      { ...atleta, id: 2, nome: 'Goleiro', posicao: 'GOL' },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Atacante')

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    const opcaoATA = screen.getByText('Atacante (ATA)')
    await user.click(opcaoATA)
    await user.click(opcaoATA)

    expect(screen.getByText('Atacante')).toBeInTheDocument()
    expect(screen.getByText('Goleiro')).toBeInTheDocument()
  })

  it('shows an empty state when no athlete matches the filters', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Goleiro', posicao: 'GOL' },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Goleiro')

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Atacante (ATA)'))

    expect(await screen.findByText(/nenhum jogador/i)).toBeInTheDocument()
  })

  it('navigates forward and backward through client-side pages without new requests', async () => {
    const paginaCheia = Array.from({ length: 25 }, (_, index) => ({
      ...atleta,
      id: index + 1,
      nome: `Jogador ${index + 1}`,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(paginaCheia)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Jogador 1')

    expect(screen.queryByText('Jogador 21')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Jogador 21')).toBeInTheDocument()
    expect(screen.queryByText('Jogador 1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Jogador 1')).toBeInTheDocument()

    // paginação inteira client-side — nenhuma nova busca ao backend
    expect(atletasApi.listarTodosAtletas).toHaveBeenCalledTimes(1)
  })

  it('combines price and average sorting across the whole dataset, not just the current page', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
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

  it('sorts by overall across the full dataset, bringing the best from a later page to the top', async () => {
    const dataset = Array.from({ length: 25 }, (_, index) => ({
      ...atleta,
      id: index + 1,
      nome: `Jogador ${index + 1}`,
      overall_score: index + 1, // Jogador 25 tem o maior overall (25), mas está na página 2
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dataset)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Jogador 1')

    await user.click(screen.getByRole('button', { name: /overall/i }))

    expect(within(screen.getAllByRole('row')[1]).getByText('Jogador 25')).toBeInTheDocument()
  })

  it('shows whether each athlete plays at home, away or has no match', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
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

  it('filters by mando when an option is clicked in mando dropdown (client-side)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Mandante', mando_rodada: 'casa' },
      { ...atleta, id: 2, nome: 'Visitante', mando_rodada: 'fora' },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Mandante')

    await user.click(screen.getByRole('button', { name: /Mando/i }))
    const listbox = screen.getByRole('listbox')
    await user.click(within(listbox).getByText('Casa'))

    expect(screen.getByText('Mandante')).toBeInTheDocument()
    expect(screen.queryByText('Visitante')).not.toBeInTheDocument()
  })

  it('toggles off active mando filter when clicked again', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Mandante', mando_rodada: 'casa' },
      { ...atleta, id: 2, nome: 'Visitante', mando_rodada: 'fora' },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Mandante')

    await user.click(screen.getByRole('button', { name: /Mando/i }))
    const listbox = screen.getByRole('listbox')
    const casaOption = within(listbox).getByText('Casa')
    await user.click(casaOption)
    expect(screen.queryByText('Visitante')).not.toBeInTheDocument()

    await user.click(casaOption)
    expect(screen.getByText('Visitante')).toBeInTheDocument()
  })

  it('shows the chance de pontuar classification, and a dash when unknown', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
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
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
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

  it('shows the overall column, and a dash when there is no data (e.g. TEC)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'ComOverall', overall_score: 69.3 },
      {
        ...atleta,
        id: 2,
        nome: 'SemOverall',
        overall_score: null,
        chance_pontuar_classificacao: 'alta',
      },
    ])
    renderJogadores()
    await screen.findByText('ComOverall')

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('69,3')).toBeInTheDocument()
    expect(within(rows[2]).getByText('—')).toBeInTheDocument()
  })

  it('sorts by chance de pontuar descending, with atletas sem dado ficando por ultimo', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
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

  it('sorts by chance de pontuar ascending, with atletas sem dado ficando por ultimo (issue #5)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Media', chance_pontuar_percentual: 80 },
      { ...atleta, id: 2, nome: 'SemDado', chance_pontuar_percentual: null },
      { ...atleta, id: 3, nome: 'Alta', chance_pontuar_percentual: 95 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Media')

    const header = screen.getByRole('button', { name: /chance de pontuar/i })
    await user.click(header) // desc
    await user.click(header) // asc

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Media')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Alta')).toBeInTheDocument()
    expect(within(rows[3]).getByText('SemDado')).toBeInTheDocument()
  })

  it('sorts by overall, with atletas sem dado ficando por ultimo', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Media', overall_score: 60 },
      { ...atleta, id: 2, nome: 'SemDado', overall_score: null },
      { ...atleta, id: 3, nome: 'Alta', overall_score: 90 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Media')

    await user.click(screen.getByRole('button', { name: /overall/i }))

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Alta')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Media')).toBeInTheDocument()
    expect(within(rows[3]).getByText('SemDado')).toBeInTheDocument()
  })

  it('sorts by media casa and media fora when header is clicked', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
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

  it('renders StatusBadge for players with status_nome', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Gabigol', status_nome: 'provavel', status_id: 7 },
    ])
    renderJogadores()
    await screen.findByText('Gabigol')

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByLabelText('Provável')).toBeInTheDocument()
  })

  it('filters players by multiple statuses in multi-select status dropdown', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Gabigol', status_nome: 'provavel', status_id: 7 },
      { ...atleta, id: 2, nome: 'Pedro', status_nome: 'duvida', status_id: 2 },
      { ...atleta, id: 3, nome: 'Weverton', status_nome: 'suspenso', status_id: 3 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Gabigol')

    expect(screen.getByText('Pedro')).toBeInTheDocument()
    expect(screen.getByText('Weverton')).toBeInTheDocument()

    // Abre o dropdown de status
    await user.click(screen.getByRole('button', { name: /Status/i }))

    // Seleciona Provável
    await user.click(screen.getByText('Provável'))
    expect(screen.getByText('Gabigol')).toBeInTheDocument()
    expect(screen.queryByText('Pedro')).not.toBeInTheDocument()
    expect(screen.queryByText('Weverton')).not.toBeInTheDocument()

    // Multi-seleção: seleciona também Dúvida
    await user.click(screen.getByText('Dúvida'))
    expect(screen.getByText('Gabigol')).toBeInTheDocument()
    expect(screen.getByText('Pedro')).toBeInTheDocument()
    expect(screen.queryByText('Weverton')).not.toBeInTheDocument()

    // Desmarca Provável: fica só Dúvida (Pedro)
    await user.click(screen.getByText('Provável'))
    expect(screen.queryByText('Gabigol')).not.toBeInTheDocument()
    expect(screen.getByText('Pedro')).toBeInTheDocument()
  })
})

