import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Atleta } from '../api/atletas'
import * as atletasApi from '../api/atletas'
import ModalCompararJogador from './ModalCompararJogador'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const atletaOrigem: Atleta = {
  id: 100,
  nome: 'Arrascaeta',
  posicao: 'MEI',
  clube_id: 262,
  clube_nome: 'Flamengo',
  preco_atual: 15.5,
  media_geral: 7.2,
  media_casa: 8.5,
  media_fora: 5.9,
  rodada_atual: 24,
  mando_rodada: 'casa',
  chance_pontuar_percentual: 90,
  chance_pontuar_classificacao: 'alta',
  media_basica: 4.1,
  overall_score: 92.4,
  status_id: 7,
  status_nome: 'provavel',
}

const listaAtletasMock: Atleta[] = [
  atletaOrigem,
  {
    id: 200,
    nome: 'Garro',
    posicao: 'MEI',
    clube_id: 264,
    clube_nome: 'Corinthians',
    preco_atual: 12.3,
    media_geral: 6.8,
    media_casa: 7.4,
    media_fora: 6.2,
    rodada_atual: 24,
    mando_rodada: 'fora',
    chance_pontuar_percentual: 85,
    chance_pontuar_classificacao: 'alta',
    media_basica: 3.8,
    overall_score: 88.0,
    status_id: 7,
    status_nome: 'provavel',
  },
  {
    id: 300,
    nome: 'Pedro',
    posicao: 'ATA',
    clube_id: 262,
    clube_nome: 'Flamengo',
    preco_atual: 18.0,
    media_geral: 8.1,
    media_casa: 9.0,
    media_fora: 7.2,
    rodada_atual: 24,
    mando_rodada: 'casa',
    chance_pontuar_percentual: 95,
    chance_pontuar_classificacao: 'alta',
    media_basica: 5.0,
    overall_score: 95.0,
    status_id: 2,
    status_nome: 'duvida',
  },
  {
    id: 400,
    nome: 'Weverton',
    posicao: 'GOL',
    clube_id: 275,
    clube_nome: 'Palmeiras',
    preco_atual: 10.0,
    media_geral: 5.5,
    media_casa: 6.0,
    media_fora: 5.0,
    rodada_atual: 24,
    mando_rodada: 'casa',
    chance_pontuar_percentual: 70,
    chance_pontuar_classificacao: 'media',
    media_basica: 2.0,
    overall_score: 80.0,
    status_id: 3,
    status_nome: 'suspenso',
  },
]

describe('ModalCompararJogador', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(listaAtletasMock)
  })

  it('não renderiza nada no DOM quando aberto é false', () => {
    const { container } = render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={false}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza o modal e lista os atletas excluindo o atleta de origem', async () => {
    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Comparar com outro jogador/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
      expect(screen.getByText('Pedro')).toBeInTheDocument()
      expect(screen.getByText('Weverton')).toBeInTheDocument()
    })

    // Atleta de origem (Arrascaeta) NÃO deve aparecer na lista de opções para comparar
    expect(screen.queryByRole('button', { name: /Arrascaeta/i })).not.toBeInTheDocument()
  })

  it('exibe as colunas resumidas: Nome, Clube, Status, Posição, Preço, Média Casa, Média Fora e Overall', async () => {
    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })

    expect(screen.getByText('Corinthians')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Provável').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MEI').length).toBeGreaterThan(0)
    expect(screen.getByText('12,3')).toBeInTheDocument() // Preço formatado
    expect(screen.getByText('7,4')).toBeInTheDocument() // Média Casa
    expect(screen.getByText('6,2')).toBeInTheDocument() // Média Fora
    expect(screen.getByText('88')).toBeInTheDocument() // Overall
  })

  it('filtra atletas por nome digitado após debounce', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })

    const inputBusca = screen.getByPlaceholderText(/Buscar por nome…/i)
    await user.type(inputBusca, 'Pedro')

    await waitFor(() => {
      expect(screen.getByText('Pedro')).toBeInTheDocument()
      expect(screen.queryByText('Garro')).not.toBeInTheDocument()
      expect(screen.queryByText('Weverton')).not.toBeInTheDocument()
    })
  })

  it('sanitiza HTML digitado no campo de busca antes de armazenar (issue #10)', async () => {
    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })

    const inputBusca = screen.getByPlaceholderText(/Buscar por nome…/i)
    fireEvent.change(inputBusca, { target: { value: '<img src=x onerror=alert(1)>Pedro' } })

    expect((inputBusca as HTMLInputElement).value).toBe('Pedro')
  })

  it('filtra atletas por posição selecionada e desmarca ao clicar novamente', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    const optGOL = screen.getByText('Goleiro (GOL)')
    await user.click(optGOL)

    await waitFor(() => {
      expect(screen.getByText('Weverton')).toBeInTheDocument()
      expect(screen.queryByText('Garro')).not.toBeInTheDocument()
      expect(screen.queryByText('Pedro')).not.toBeInTheDocument()
    })

    // Desmarca a posição
    await user.click(optGOL)
    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
      expect(screen.getByText('Pedro')).toBeInTheDocument()
    })
  })

  it('filtra atletas por múltiplos status no dropdown de status do modal', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Dúvida'))

    await waitFor(() => {
      expect(screen.getByText('Pedro')).toBeInTheDocument()
      expect(screen.queryByText('Garro')).not.toBeInTheDocument()
      expect(screen.queryByText('Weverton')).not.toBeInTheDocument()
    })

    // Adiciona Provável na multi-seleção
    await user.click(screen.getByText('Provável'))
    await waitFor(() => {
      expect(screen.getByText('Pedro')).toBeInTheDocument()
      expect(screen.getByText('Garro')).toBeInTheDocument()
      expect(screen.queryByText('Weverton')).not.toBeInTheDocument()
    })
  })

  it('ordena por preço, média casa, média fora e overall ao clicar nos cabeçalhos', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })

    // Ordena por preço
    const btnPreco = screen.getByRole('button', { name: /preço/i })
    await user.click(btnPreco)

    let rows = screen.getAllByRole('button').filter((el) => el.classList.contains('modal-table-row'))
    expect(within(rows[0]).getByText('Pedro')).toBeInTheDocument() // Mais caro primeiro (18.0)

    // Ordena por média casa
    const btnCasa = screen.getByRole('button', { name: /média casa/i })
    await user.click(btnCasa)
    rows = screen.getAllByRole('button').filter((el) => el.classList.contains('modal-table-row'))
    expect(within(rows[0]).getByText('Pedro')).toBeInTheDocument()

    // Ordena por média fora
    const btnFora = screen.getByRole('button', { name: /média fora/i })
    await user.click(btnFora)
    rows = screen.getAllByRole('button').filter((el) => el.classList.contains('modal-table-row'))
    expect(within(rows[0]).getByText('Pedro')).toBeInTheDocument()

    // Ordena por overall
    const btnOverall = screen.getByRole('button', { name: /overall/i })
    await user.click(btnOverall)
    rows = screen.getAllByRole('button').filter((el) => el.classList.contains('modal-table-row'))
    expect(within(rows[0]).getByText('Pedro')).toBeInTheDocument()
  })

  it('ao clicar em um atleta da lista, redireciona para /comparar?a={idOrigem}&b={idEscolhido} e fecha o modal', async () => {
    const user = userEvent.setup()
    const onFechar = vi.fn()

    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={onFechar}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })

    const linhaGarro = screen.getByText('Garro').closest('[role="button"]')!
    await user.click(linhaGarro)

    expect(mockNavigate).toHaveBeenCalledWith('/comparar?a=100&b=200')
    expect(onFechar).toHaveBeenCalled()
  })

  it('permite selecionar um atleta pressionando a tecla Enter ou Espaço na linha', async () => {
    const onFechar = vi.fn()

    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={onFechar}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Pedro')).toBeInTheDocument()
    })

    const linhaPedro = screen.getByText('Pedro').closest('[role="button"]')!
    fireEvent.keyDown(linhaPedro, { key: 'Enter' })

    expect(mockNavigate).toHaveBeenCalledWith('/comparar?a=100&b=300')
    expect(onFechar).toHaveBeenCalled()
  })

  it('fecha o modal ao clicar no botão fechar (✕)', async () => {
    const user = userEvent.setup()
    const onFechar = vi.fn()

    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={onFechar}
        />
      </MemoryRouter>,
    )

    const btnFechar = screen.getByRole('button', { name: /Fechar modal/i })
    await user.click(btnFechar)

    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('fecha o modal ao clicar no backdrop (overlay externo)', () => {
    const onFechar = vi.fn()

    const { container } = render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={onFechar}
        />
      </MemoryRouter>,
    )

    const overlay = container.querySelector('.modal-overlay')!
    fireEvent.click(overlay)

    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('fecha o modal ao pressionar a tecla Escape', () => {
    const onFechar = vi.fn()

    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={onFechar}
        />
      </MemoryRouter>,
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('mostra mensagem de erro caso a chamada da API falhe', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockRejectedValue(new Error('Erro de conexão'))

    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro de conexão')
  })

  it('suporta paginação quando há mais de 15 atletas', async () => {
    const muitosAtletas: Atleta[] = Array.from({ length: 25 }, (_, i) => ({
      ...atletaOrigem,
      id: 500 + i,
      nome: `Atleta Extra ${i + 1}`,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(muitosAtletas)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ModalCompararJogador
          atletaOrigem={atletaOrigem}
          aberto={true}
          onFechar={vi.fn()}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Atleta Extra 1')).toBeInTheDocument()
    })

    const btnProxima = screen.getByRole('button', { name: /Próxima/i })
    expect(btnProxima).not.toBeDisabled()

    await user.click(btnProxima)
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument()
    expect(screen.getByText('Atleta Extra 16')).toBeInTheDocument()

    const btnAnterior = screen.getByRole('button', { name: /Anterior/i })
    await user.click(btnAnterior)
    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument()
  })
})
