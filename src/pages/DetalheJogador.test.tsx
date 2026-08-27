import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from 'react-router-dom'
import DetalheJogador from './DetalheJogador'
import * as atletasApi from '../api/atletas'
import * as percentisApi from '../api/percentis'
import * as raioXApi from '../api/raioX'
import * as perfilRiscoApi from '../api/perfilRisco'
import * as mpvApi from '../api/mpv'

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

const perfilRisco = {
  atleta_id: 1,
  risco_percentual: 70,
  classificacao: 'alto' as const,
  pontos_retorno_direto: 132,
  pontos_participacao: 56.5,
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
      media_basica: 75,
      overall_score: 70.2,
    })
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue({
      atleta_id: 1,
      posicao: 'ATA',
      rodada: 24,
      mando: 'casa',
      clube_adversario_id: 267,
      clube_adversario_nome: 'Vasco',
      media_no_mando: 7.15,
      pontos_cedidos_adversario: 4.89,
      participacao_pontuacao_time_media: 12.4,
      veredito: 'referencia_do_time',
    })
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRisco)
    vi.spyOn(mpvApi, 'buscarMpvAtleta').mockResolvedValue({
      mpv_estimado: 2,
      faixa_preco: { min: 1, max: 10 },
      coeficientes: { a: 0.5, b: -1 },
      amostras: 35,
      confiavel: true,
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

  it('mostra o pentágono de qualidade quando os percentis carregam com sucesso', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])
    vi.mocked(percentisApi.buscarPercentisAtleta).mockResolvedValue({
      atleta_id: 1,
      pontuacao_media: 80,
      participacao_gol: 91,
      desarme: 40,
      disciplina: 65,
      media_basica: 75,
      overall_score: 70.2,
    })

    renderDetalhe('1', null)

    expect(await screen.findByText(/criação/i)).toBeInTheDocument()
    expect(screen.getByText(/combate/i)).toBeInTheDocument()
    expect(screen.getByText(/disciplina/i)).toBeInTheDocument()
    expect(screen.getByText(/piso básico/i)).toBeInTheDocument()
    expect(screen.getByTestId('overall-score')).toHaveTextContent('70,2')
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

  it('mostra o raio-x quando ele carrega com sucesso', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])

    renderDetalhe('1', null)

    expect(await screen.findByText('Raio-X do confronto')).toBeInTheDocument()
    expect(screen.getByText('Referência do time')).toBeInTheDocument()
  })

  it('mostra a mensagem de erro no lugar do raio-x quando o raio-x da 404', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])
    vi.mocked(raioXApi.buscarRaioXConfronto).mockRejectedValue(
      new Error('raio-x nao disponivel para tecnico'),
    )

    renderDetalhe('1', null)

    expect(await screen.findByText(/raio-x nao disponivel/i)).toBeInTheDocument()
  })

  it('mostra o selo de risco quando o perfil carrega com sucesso', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])

    renderDetalhe('1', null)

    expect(await screen.findByText(/risco alto/i)).toBeInTheDocument()
  })

  it('mostra a mensagem de erro no lugar do selo quando o perfil de risco da 404', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockRejectedValue(
      new Error('dados insuficientes - atleta com poucos jogos pra calcular perfil de risco'),
    )

    renderDetalhe('1', null)

    expect(await screen.findByText(/dados insuficientes/i)).toBeInTheDocument()
  })

  it('mostra a média básica do atleta na tela de detalhe', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])

    renderDetalhe('1', null)

    expect(await screen.findByText('Média básica')).toBeInTheDocument()
    expect(screen.getByText('4,12')).toBeInTheDocument()
  })

  it('mantém info base e pentágono dentro do mesmo container de layout lado a lado', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])

    const { container } = renderDetalhe('1', null)

    const heading = await screen.findByRole('heading', { name: 'Gabigol' })
    const pentagono = await screen.findByRole('img', { name: /pentágono de qualidade/i })

    const topo = container.querySelector('.detalhe-topo')
    expect(topo).not.toBeNull()
    expect(topo).toContainElement(heading)
    expect(topo).toContainElement(pentagono)
  })

  it('mostra MPV com selo permanente de estimativa historica', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([])

    renderDetalhe('1', null)

    expect(await screen.findByText('C$ 2,00')).toBeInTheDocument()
    expect(screen.getByText(/estimativa baseada em dados históricos/i)).toBeInTheDocument()
  })

  it('mostra dados insuficientes quando o MPV nao e confiavel', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([])
    vi.mocked(mpvApi.buscarMpvAtleta).mockResolvedValue({
      mpv_estimado: null,
      faixa_preco: { min: 1, max: 10 },
      coeficientes: { a: 0, b: 0 },
      amostras: 3,
      confiavel: false,
    })

    renderDetalhe('1', null)

    expect(await screen.findByText(/dados insuficientes ainda para estimar/i)).toBeInTheDocument()
    expect(screen.queryByText(/C\$ NaN/i)).not.toBeInTheDocument()
  })

  it('mapeia 404 de dados de MPV para o estado insuficiente', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([])
    vi.mocked(mpvApi.buscarMpvAtleta).mockRejectedValue(
      new Error('dados insuficientes — sem preço registrado para o atleta'),
    )

    renderDetalhe('1', null)

    expect(await screen.findByText(/dados insuficientes ainda para estimar/i)).toBeInTheDocument()
  })

  it('limpa MPV e erro anteriores ao navegar entre jogadores na mesma rota', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation(async (id) => ({
      ...atleta,
      id,
      nome: `Atleta ${id}`,
    }))
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([])
    let resolverSegundo: ((valor: mpvApi.MpvAtleta) => void) | undefined
    vi.mocked(mpvApi.buscarMpvAtleta).mockImplementation((id) => {
      if (id === 1) {
        return Promise.resolve({
          mpv_estimado: 2,
          faixa_preco: { min: 1, max: 10 },
          coeficientes: { a: 0.5, b: -1 },
          amostras: 35,
          confiavel: true,
        })
      }
      if (id === 2) {
        return new Promise((resolve) => {
          resolverSegundo = resolve
        })
      }
      return Promise.reject(new Error('Falha temporária de MPV'))
    })
    const router = createMemoryRouter(
      [{ path: '/jogadores/:id', element: <DetalheJogador /> }],
      { initialEntries: ['/jogadores/1'] },
    )
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('C$ 2,00')).toBeInTheDocument()
    await act(() => router.navigate('/jogadores/2'))
    await waitFor(() => expect(mpvApi.buscarMpvAtleta).toHaveBeenCalledWith(2))
    expect(screen.queryByText('C$ 2,00')).not.toBeInTheDocument()

    resolverSegundo?.({
      mpv_estimado: 3,
      faixa_preco: { min: 1, max: 10 },
      coeficientes: { a: 0.5, b: -1 },
      amostras: 35,
      confiavel: true,
    })
    expect(await screen.findByText('C$ 3,00')).toBeInTheDocument()

    await act(() => router.navigate('/jogadores/3'))
    expect(await screen.findByText('Falha temporária de MPV')).toBeInTheDocument()
    await act(() => router.navigate('/jogadores/1'))
    expect(await screen.findByText('C$ 2,00')).toBeInTheDocument()
    expect(screen.queryByText('Falha temporária de MPV')).not.toBeInTheDocument()
  })

  it('renders StatusBadge when atleta has status_nome or status_id', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue({
      ...atleta,
      status_nome: 'provavel',
      status_id: 7,
    })
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])

    renderDetalhe('1')
    await screen.findByText('Gabigol')

    expect(screen.getByText('Provável')).toBeInTheDocument()
  })

  it('renders the "Comparar jogador" button and opens the comparison modal when clicked', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(atleta)
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      atleta,
      {
        ...atleta,
        id: 2,
        nome: 'Pedro',
      },
    ])

    renderDetalhe('1')
    await screen.findByText('Gabigol')

    const btnComparar = screen.getByRole('button', { name: /Comparar jogador/i })
    expect(btnComparar).toBeInTheDocument()

    // Clica no botão e abre o modal
    await act(async () => {
      btnComparar.click()
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Comparar com outro jogador/i)).toBeInTheDocument()
  })
})
