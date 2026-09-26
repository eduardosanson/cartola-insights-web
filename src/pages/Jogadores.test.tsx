import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
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
    // apenas o estado de tabela carregada deve estar visível
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/nenhum jogador/i)).not.toBeInTheDocument()
  })

  it('shows the loading message before the atletas request resolves, and only that message', async () => {
    let resolveAtletas: (value: (typeof atleta)[]) => void = () => {}
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockReturnValue(
      new Promise((resolve) => {
        resolveAtletas = resolve
      }),
    )

    renderJogadores()

    expect(screen.getByText('Carregando jogadores…')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/nenhum jogador/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await act(async () => {
      resolveAtletas([atleta])
      await Promise.resolve()
    })
  })

  it('shows an error message when the API call fails, and only that message', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockRejectedValue(new Error('Falha de rede'))

    renderJogadores()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede')
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/nenhum jogador/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
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
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Jogador 21')).toBeInTheDocument()
    expect(screen.queryByText('Jogador 1')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).not.toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Jogador 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    // paginação inteira client-side — nenhuma nova busca ao backend
    expect(atletasApi.listarTodosAtletas).toHaveBeenCalledTimes(1)
  })

  it('disables Próxima when there is only a single page of results', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([atleta])
    renderJogadores()
    await screen.findByText('Gabigol')

    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it('disables Próxima when exactly one full page of results exists (boundary at PAGE_SIZE)', async () => {
    const paginaExata = Array.from({ length: 20 }, (_, index) => ({
      ...atleta,
      id: index + 1,
      nome: `Jogador ${index + 1}`,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(paginaExata)
    renderJogadores()
    await screen.findByText('Jogador 1')

    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
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

    const btnOverall = screen.getByRole('button', { name: /overall/i })
    await user.click(btnOverall)

    expect(within(screen.getAllByRole('row')[1]).getByText('Jogador 25')).toBeInTheDocument()
    expect(btnOverall).toHaveTextContent('↓ 1')
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
    // antes de selecionar, nenhuma opção deve constar como selecionada nem exibir "Limpar"
    expect(within(listbox).queryByText('Limpar')).not.toBeInTheDocument()

    await user.click(within(listbox).getByText('Casa'))

    expect(screen.getByText('Mandante')).toBeInTheDocument()
    expect(screen.queryByText('Visitante')).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Casa' })).toHaveAttribute('aria-selected', 'true')
    expect(within(listbox).getByText('Limpar')).toBeInTheDocument()
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

  it('shows the chance de pontuar classification for alta/media/baixa, and a dash when unknown', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Artilheiro', chance_pontuar_classificacao: 'alta' },
      { ...atleta, id: 2, nome: 'Mediano', chance_pontuar_classificacao: 'media' },
      { ...atleta, id: 3, nome: 'Reservinha', chance_pontuar_classificacao: 'baixa' },
      { ...atleta, id: 4, nome: 'Reserva', chance_pontuar_classificacao: null },
    ])
    renderJogadores()
    await screen.findByText('Artilheiro')

    const rows = screen.getAllByRole('row')
    const badgeAlta = within(rows[1]).getByText('Alta')
    expect(badgeAlta).toBeInTheDocument()
    expect(badgeAlta).toHaveClass('chance-badge', 'chance-alta')

    const badgeMedia = within(rows[2]).getByText('Média')
    expect(badgeMedia).toHaveClass('chance-badge', 'chance-media')

    const badgeBaixa = within(rows[3]).getByText('Baixa')
    expect(badgeBaixa).toHaveClass('chance-badge', 'chance-baixa')

    expect(within(rows[4]).getByText('—')).toBeInTheDocument()
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

    const btnBasica = screen.getByRole('button', { name: /média básica/i })
    await user.click(btnBasica)

    expect(within(screen.getAllByRole('row')[1]).getByText('B')).toBeInTheDocument()
    expect(btnBasica).toHaveTextContent('↓ 1')
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

    const btnChance = screen.getByRole('button', { name: /chance de pontuar/i })
    await user.click(btnChance)

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Alta')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Media')).toBeInTheDocument()
    expect(within(rows[3]).getByText('SemDado')).toBeInTheDocument()
    expect(btnChance).toHaveTextContent('↓ 1')
  })

  it('treats a missing chance de pontuar as lower than an actual zero when sorting descending', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Outro', chance_pontuar_percentual: 50 },
      { ...atleta, id: 2, nome: 'Zero', chance_pontuar_percentual: 0 },
      { ...atleta, id: 3, nome: 'SemDado', chance_pontuar_percentual: null },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Outro')

    await user.click(screen.getByRole('button', { name: /chance de pontuar/i }))

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Outro')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Zero')).toBeInTheDocument()
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

  it('sorts by overall ascending with atletas sem dado ficando por ultimo (issue #35)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'SemDado', overall_score: null },
      { ...atleta, id: 2, nome: 'Zero', overall_score: 0 },
      { ...atleta, id: 3, nome: 'Oitenta', overall_score: 80 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('SemDado')

    const header = screen.getByRole('button', { name: /overall/i })
    await user.click(header) // desc

    let rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Oitenta')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Zero')).toBeInTheDocument()
    expect(within(rows[3]).getByText('SemDado')).toBeInTheDocument()

    await user.click(header) // asc

    rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Zero')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Oitenta')).toBeInTheDocument()
    expect(within(rows[3]).getByText('SemDado')).toBeInTheDocument()
  })

  it('mantém desempate estável ao ordenar por overall quando múltiplos atletas têm valor nulo (issue #35)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'SemDado1', overall_score: null },
      { ...atleta, id: 2, nome: 'ComDado', overall_score: 50 },
      { ...atleta, id: 3, nome: 'SemDado2', overall_score: null },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('ComDado')

    const header = screen.getByRole('button', { name: /overall/i })
    await user.click(header) // desc

    let rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('ComDado')).toBeInTheDocument()
    expect(within(rows[2]).getByText('SemDado1')).toBeInTheDocument()
    expect(within(rows[3]).getByText('SemDado2')).toBeInTheDocument()

    await user.click(header) // asc

    rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('ComDado')).toBeInTheDocument()
    expect(within(rows[2]).getByText('SemDado1')).toBeInTheDocument()
    expect(within(rows[3]).getByText('SemDado2')).toBeInTheDocument()
  })

  it('treats a missing overall score as lower than an actual zero when sorting descending', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Outro', overall_score: 50 },
      { ...atleta, id: 2, nome: 'Zero', overall_score: 0 },
      { ...atleta, id: 3, nome: 'SemDado', overall_score: null },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Outro')

    await user.click(screen.getByRole('button', { name: /overall/i }))

    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('Outro')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Zero')).toBeInTheDocument()
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
    expect(btnCasa).toHaveTextContent('↓ 1')

    // untoggle casa (click 2 more times: desc -> asc -> none)
    await user.click(btnCasa)
    await user.click(btnCasa)

    const btnFora = screen.getByRole('button', { name: /média fora/i })
    await user.click(btnFora)
    expect(within(screen.getAllByRole('row')[1]).getByText('A')).toBeInTheDocument()
    expect(btnFora).toHaveTextContent('↓ 1')
  })

  it('sorts by media fora using the athlete-specific value (not a fixed order)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Baixo', media_fora: 2 },
      { ...atleta, id: 2, nome: 'Alto', media_fora: 9 },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Baixo')

    await user.click(screen.getByRole('button', { name: /média fora/i }))

    expect(within(screen.getAllByRole('row')[1]).getByText('Alto')).toBeInTheDocument()
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
    const badge = within(rows[1]).getByLabelText('Provável')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('[role="cell"]')).toHaveStyle({
      display: 'flex',
      justifyContent: 'center',
    })
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

  it('starts with the search field empty', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    expect(screen.getByPlaceholderText(/buscar/i)).toHaveValue('')
  })

  it('does not filter out players before the name debounce timer fires (initial debounced value is empty)', async () => {
    vi.useFakeTimers()

    renderJogadores()

    // deixa a promise de busca de atletas resolver, sem avançar o timer de debounce
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByText('Gabigol')).toBeInTheDocument()
  })

  it('resets the debounce timer on each keystroke (does not apply a stale filter)', async () => {
    vi.useFakeTimers()
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Gabigol' },
      { ...atleta, id: 2, nome: 'Guilherme' },
    ])
    renderJogadores()

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByText('Gabigol')).toBeInTheDocument()

    const input = screen.getByPlaceholderText(/buscar/i)

    fireEvent.change(input, { target: { value: 'Gab' } })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    fireEvent.change(input, { target: { value: 'Gui' } })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // 300ms se passaram desde o 1º keystroke ('Gab'), mas só 100ms desde o
    // 2º ('Gui') — se o timer do 1º keystroke não tiver sido cancelado, ele
    // já teria disparado e aplicado o filtro errado ('gab'), escondendo
    // 'Guilherme'
    expect(screen.getByText('Gabigol')).toBeInTheDocument()
    expect(screen.getByText('Guilherme')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // agora sim, 300ms se passaram desde 'Gui'
    expect(screen.queryByText('Gabigol')).not.toBeInTheDocument()
    expect(screen.getByText('Guilherme')).toBeInTheDocument()
  })

  it('trims whitespace from the search term before filtering', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Gabigol' },
      { ...atleta, id: 2, nome: 'Pedro' },
    ])
    renderJogadores()
    await screen.findByText('Gabigol')

    const input = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(input, { target: { value: '  Gabi  ' } })

    await waitFor(() => expect(screen.queryByText('Pedro')).not.toBeInTheDocument(), {
      timeout: 1000,
    })
    expect(screen.getByText('Gabigol')).toBeInTheDocument()
  })

  it('resets to page 1 when the search term changes while on a later page', async () => {
    const dataset = Array.from({ length: 25 }, (_, index) => ({
      ...atleta,
      id: index + 1,
      nome: `Jogador ${index + 1}`,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dataset)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Jogador 1')

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Jogador 21')

    const input = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(input, { target: { value: 'Jogador' } })

    expect(await screen.findByText('Jogador 1')).toBeInTheDocument()
  })

  it('does not update state after unmount when the atletas request resolves later', async () => {
    let resolveAtletas: (value: (typeof atleta)[]) => void = () => {}
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockReturnValue(
      new Promise((resolve) => {
        resolveAtletas = resolve
      }),
    )
    const { unmount } = renderJogadores()
    unmount()

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await act(async () => {
      resolveAtletas([atleta])
      await Promise.resolve()
    })

    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('does not update state after unmount when the atletas request fails later', async () => {
    let rejectAtletas: (err: Error) => void = () => {}
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectAtletas = reject
      }),
    )
    const { unmount } = renderJogadores()
    unmount()

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await act(async () => {
      rejectAtletas(new Error('Falha de rede'))
      await Promise.resolve()
    })

    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('resets to page 1 when a position filter is toggled while on a later page', async () => {
    const dataset = Array.from({ length: 25 }, (_, index) => ({
      ...atleta,
      id: index + 1,
      nome: `Jogador ${index + 1}`,
      posicao: 'ATA' as const,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dataset)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Jogador 1')

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Jogador 21')

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Atacante (ATA)'))

    expect(await screen.findByText('Jogador 1')).toBeInTheDocument()
  })

  it('removes only the toggled position, keeping other active position filters', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Atacante', posicao: 'ATA' },
      { ...atleta, id: 2, nome: 'Zagueiro', posicao: 'ZAG' },
      { ...atleta, id: 3, nome: 'Lateral', posicao: 'LAT' },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Atacante')

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Atacante (ATA)'))
    await user.click(screen.getByText('Zagueiro (ZAG)'))

    expect(screen.getByText('Atacante')).toBeInTheDocument()
    expect(screen.getByText('Zagueiro')).toBeInTheDocument()
    expect(screen.queryByText('Lateral')).not.toBeInTheDocument()

    // desmarca apenas ATA, mantendo o filtro de ZAG ativo
    await user.click(screen.getByText('Atacante (ATA)'))

    expect(screen.queryByText('Atacante')).not.toBeInTheDocument()
    expect(screen.getByText('Zagueiro')).toBeInTheDocument()
    expect(screen.queryByText('Lateral')).not.toBeInTheDocument()
  })

  it('filters correctly for every position value (GOL, ZAG, LAT, MEI, TEC)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Goleiro', posicao: 'GOL' },
      { ...atleta, id: 2, nome: 'Zagueiro', posicao: 'ZAG' },
      { ...atleta, id: 3, nome: 'Lateral', posicao: 'LAT' },
      { ...atleta, id: 4, nome: 'Meia', posicao: 'MEI' },
      { ...atleta, id: 5, nome: 'Tecnico', posicao: 'TEC' },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Goleiro')

    await user.click(screen.getByRole('button', { name: /Posição/i }))

    const casos: Array<[string, string]> = [
      ['Goleiro (GOL)', 'Goleiro'],
      ['Zagueiro (ZAG)', 'Zagueiro'],
      ['Lateral (LAT)', 'Lateral'],
      ['Meia (MEI)', 'Meia'],
      ['Técnico (TEC)', 'Tecnico'],
    ]

    for (const [opcaoLabel, nomeEsperado] of casos) {
      await user.click(screen.getByText(opcaoLabel))
      expect(screen.getByText(nomeEsperado)).toBeInTheDocument()
      await user.click(screen.getByText(opcaoLabel)) // desmarca antes do próximo caso
    }
  })

  it('clears position filters and resets to page 1 via the Limpar button', async () => {
    const dataset = [
      ...Array.from({ length: 25 }, (_, index) => ({
        ...atleta,
        id: index + 1,
        nome: `Atacante ${index + 1}`,
        posicao: 'ATA' as const,
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        ...atleta,
        id: 100 + index,
        nome: `Zagueiro ${index + 1}`,
        posicao: 'ZAG' as const,
      })),
    ]
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dataset)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Atacante 1')

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Atacante (ATA)'))
    expect(screen.queryByText('Zagueiro 1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Atacante 21')

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Limpar'))

    expect(await screen.findByText('Atacante 1')).toBeInTheDocument()
    // confirma que o filtro foi realmente limpo (não só a paginação): o
    // grupo antes escondido volta a existir no dataset completo (página 2)
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Zagueiro 1')).toBeInTheDocument()
  })

  it('resets to page 1 when a status filter is toggled while on a later page', async () => {
    const dataset = Array.from({ length: 25 }, (_, index) => ({
      ...atleta,
      id: index + 1,
      nome: `Jogador ${index + 1}`,
      status_nome: 'provavel' as const,
      status_id: 7,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dataset)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Jogador 1')

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Jogador 21')

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Provável'))

    expect(await screen.findByText('Jogador 1')).toBeInTheDocument()
  })

  it('renders all status options in status dropdown', async () => {
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Gabigol')

    await user.click(screen.getByRole('button', { name: /Status/i }))

    for (const label of ['Provável', 'Dúvida', 'Suspenso', 'Contundido', 'Nulo']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('filters by additional statuses: suspenso, contundido and nulo', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Suspenso1', status_nome: 'suspenso', status_id: 3 },
      { ...atleta, id: 2, nome: 'Contundido1', status_nome: 'contundido', status_id: 5 },
      { ...atleta, id: 3, nome: 'Nulo1', status_nome: 'nulo', status_id: 6 },
      { ...atleta, id: 4, nome: 'SemStatus', status_nome: undefined },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Suspenso1')

    await user.click(screen.getByRole('button', { name: /Status/i }))

    await user.click(screen.getByText('Suspenso'))
    expect(screen.getByText('Suspenso1')).toBeInTheDocument()
    expect(screen.queryByText('Contundido1')).not.toBeInTheDocument()
    expect(screen.queryByText('Nulo1')).not.toBeInTheDocument()
    expect(screen.queryByText('SemStatus')).not.toBeInTheDocument()
    await user.click(screen.getByText('Suspenso')) // desmarca

    await user.click(screen.getByText('Contundido'))
    expect(screen.getByText('Contundido1')).toBeInTheDocument()
    expect(screen.queryByText('Suspenso1')).not.toBeInTheDocument()
    expect(screen.queryByText('Nulo1')).not.toBeInTheDocument()
    await user.click(screen.getByText('Contundido')) // desmarca

    await user.click(screen.getByText('Nulo'))
    expect(screen.getByText('Nulo1')).toBeInTheDocument()
    expect(screen.queryByText('Suspenso1')).not.toBeInTheDocument()
    expect(screen.queryByText('Contundido1')).not.toBeInTheDocument()
  })

  it('clears status filters and resets to page 1 via the Limpar button', async () => {
    const dataset = [
      ...Array.from({ length: 25 }, (_, index) => ({
        ...atleta,
        id: index + 1,
        nome: `Provavel ${index + 1}`,
        status_nome: 'provavel' as const,
        status_id: 7,
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        ...atleta,
        id: 100 + index,
        nome: `SemStatus ${index + 1}`,
        status_nome: undefined,
      })),
    ]
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dataset)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Provavel 1')

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Provável'))
    expect(screen.queryByText('SemStatus 1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Provavel 21')

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Limpar'))

    expect(await screen.findByText('Provavel 1')).toBeInTheDocument()
    // confirma que o filtro foi realmente limpo (não só a paginação): o
    // grupo antes escondido volta a existir no dataset completo (página 2)
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('SemStatus 1')).toBeInTheDocument()
  })

  it('filters by mando "fora" using the dropdown option', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      { ...atleta, id: 1, nome: 'Mandante', mando_rodada: 'casa' },
      { ...atleta, id: 2, nome: 'Visitante', mando_rodada: 'fora' },
    ])
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Mandante')

    await user.click(screen.getByRole('button', { name: /Mando/i }))
    const listbox = screen.getByRole('listbox')
    expect(within(listbox).getByText('Fora')).toBeInTheDocument()
    await user.click(within(listbox).getByText('Fora'))

    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.queryByText('Mandante')).not.toBeInTheDocument()
  })

  it('resets to page 1 when a mando filter is toggled while on a later page', async () => {
    const dataset = Array.from({ length: 25 }, (_, index) => ({
      ...atleta,
      id: index + 1,
      nome: `Jogador ${index + 1}`,
      mando_rodada: 'casa' as const,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dataset)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Jogador 1')

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Jogador 21')

    await user.click(screen.getByRole('button', { name: /Mando/i }))
    await user.click(within(screen.getByRole('listbox')).getByText('Casa'))

    expect(await screen.findByText('Jogador 1')).toBeInTheDocument()
  })

  it('clears the mando filter and resets to page 1 via the Limpar button', async () => {
    const dataset = [
      ...Array.from({ length: 25 }, (_, index) => ({
        ...atleta,
        id: index + 1,
        nome: `Casa ${index + 1}`,
        mando_rodada: 'casa' as const,
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        ...atleta,
        id: 100 + index,
        nome: `Fora ${index + 1}`,
        mando_rodada: 'fora' as const,
      })),
    ]
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dataset)
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Casa 1')

    await user.click(screen.getByRole('button', { name: /Mando/i }))
    await user.click(within(screen.getByRole('listbox')).getByText('Casa'))
    expect(screen.queryByText('Fora 1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Casa 21')

    await user.click(screen.getByRole('button', { name: /Mando/i }))
    await user.click(within(screen.getByRole('listbox')).getByText('Limpar'))

    expect(await screen.findByText('Casa 1')).toBeInTheDocument()
    // confirma que o filtro foi realmente limpo (não só a paginação): o
    // grupo antes escondido volta a existir no dataset completo (página 2)
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Fora 1')).toBeInTheDocument()
  })

  it('centers the status column header', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    expect(screen.getByText('St')).toHaveStyle({ textAlign: 'center' })
  })

  it('passes the full atleta object as router state when navigating to the detail page', async () => {
    function CapturaEstado() {
      const estado = useLocation().state
      return <pre data-testid="estado-recebido">{JSON.stringify(estado)}</pre>
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Jogadores />} />
          <Route path="/jogadores/:id" element={<CapturaEstado />} />
        </Routes>
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await screen.findByText('Gabigol')

    await user.click(screen.getByText('Gabigol'))

    expect(await screen.findByTestId('estado-recebido')).toHaveTextContent(
      JSON.stringify({ atleta }),
    )
  })
})

