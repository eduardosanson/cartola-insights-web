import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ComponentProps } from 'react'
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

function renderModal(props: Partial<ComponentProps<typeof ModalCompararJogador>> = {}) {
  return render(
    <MemoryRouter>
      <ModalCompararJogador
        atletaOrigem={atletaOrigem}
        aberto={true}
        onFechar={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  )
}

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

    // Com resultados, não deve mostrar a mensagem de lista vazia nem "Carregando"
    expect(screen.queryByText('Nenhum jogador encontrado.')).not.toBeInTheDocument()
    expect(screen.queryByText('Carregando jogadores…')).not.toBeInTheDocument()

    // Na página 1, "Anterior" deve estar desabilitado
    expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled()
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
    // Em estado de erro, não deve mostrar "Carregando" nem a tabela de jogadores
    expect(screen.queryByText('Carregando jogadores…')).not.toBeInTheDocument()
    expect(screen.queryByText('Jogador')).not.toBeInTheDocument()
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

    // Página 1 mostra exatamente os 15 primeiros itens (slice aplicado)
    expect(screen.queryByText('Atleta Extra 16')).not.toBeInTheDocument()
    let linhas = screen
      .getAllByRole('button')
      .filter((el) => el.classList.contains('modal-table-row'))
    expect(linhas).toHaveLength(15)

    const btnProxima = screen.getByRole('button', { name: /Próxima/i })
    expect(btnProxima).not.toBeDisabled()

    await user.click(btnProxima)
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument()
    expect(screen.getByText('Atleta Extra 16')).toBeInTheDocument()
    // Página 2 mostra somente os 10 itens restantes (início calculado com * e não /)
    expect(screen.queryByText('Atleta Extra 1')).not.toBeInTheDocument()
    linhas = screen.getAllByRole('button').filter((el) => el.classList.contains('modal-table-row'))
    expect(linhas).toHaveLength(10)

    const btnAnterior = screen.getByRole('button', { name: /Anterior/i })
    await user.click(btnAnterior)
    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument()
  })

  it('desabilita "Próxima" quando há exatamente 15 atletas (limite exato da página)', async () => {
    const quinzeAtletas: Atleta[] = Array.from({ length: 15 }, (_, i) => ({
      ...atletaOrigem,
      id: 1000 + i,
      nome: `Jog${i + 1}`,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(quinzeAtletas)

    renderModal()

    await waitFor(() => {
      expect(screen.getByText('Jog1')).toBeInTheDocument()
    })

    expect(screen.getByText(/Página 1 de 1/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Próxima/i })).toBeDisabled()
  })

  it('habilita "Próxima" quando há 16 atletas (uma unidade acima do limite da página)', async () => {
    const dezesseisAtletas: Atleta[] = Array.from({ length: 16 }, (_, i) => ({
      ...atletaOrigem,
      id: 1100 + i,
      nome: `Jog${i + 1}`,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(dezesseisAtletas)

    renderModal()

    await waitFor(() => {
      expect(screen.getByText('Jog1')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Próxima/i })).not.toBeDisabled()
  })

  it('inicia com nomeDebounced vazio, sem filtrar a lista antes do debounce disparar', async () => {
    renderModal()

    // O debounce leva 300ms; com o valor inicial correto (''), a lista já
    // aparece completa bem antes disso — sem esperar o debounce "corrigir"
    // um valor inicial incorreto.
    await waitFor(
      () => {
        expect(screen.getByText('Garro')).toBeInTheDocument()
        expect(screen.getByText('Pedro')).toBeInTheDocument()
        expect(screen.getByText('Weverton')).toBeInTheDocument()
      },
      { timeout: 200 },
    )
  })

  it('cancela o timer de debounce anterior ao digitar novamente (cleanup do efeito)', async () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    const inputBusca = screen.getByPlaceholderText(/Buscar por nome…/i)
    await user.type(inputBusca, 'Pe')

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('não busca atletas nem escuta Escape quando aberto é false (guarda dos efeitos)', () => {
    const onFechar = vi.fn()
    renderModal({ aberto: false, onFechar })

    expect(atletasApi.listarTodosAtletas).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onFechar).not.toHaveBeenCalled()
  })

  it('descarta resposta tardia da API se o modal foi fechado antes dela chegar (evita dado obsoleto)', async () => {
    let resolverPrimeira: (value: Atleta[]) => void
    const primeiraPromise = new Promise<Atleta[]>((resolve) => {
      resolverPrimeira = resolve
    })
    const segundaPromise = new Promise<Atleta[]>(() => {})

    vi.spyOn(atletasApi, 'listarTodosAtletas')
      .mockReturnValueOnce(primeiraPromise)
      .mockReturnValueOnce(segundaPromise)

    const { rerender } = renderModal({ aberto: true })

    rerender(
      <MemoryRouter>
        <ModalCompararJogador atletaOrigem={atletaOrigem} aberto={false} onFechar={vi.fn()} />
      </MemoryRouter>,
    )

    await act(async () => {
      resolverPrimeira!(listaAtletasMock)
      await primeiraPromise
    })

    rerender(
      <MemoryRouter>
        <ModalCompararJogador atletaOrigem={atletaOrigem} aberto={true} onFechar={vi.fn()} />
      </MemoryRouter>,
    )

    // A resposta tardia (recebida enquanto fechado) não deve ter sido aplicada:
    // ao reabrir, o modal ainda mostra "Carregando", esperando a nova busca.
    expect(screen.getByText('Carregando jogadores…')).toBeInTheDocument()
    expect(screen.queryByText('Garro')).not.toBeInTheDocument()
  })

  it('descarta erro tardio da API se o modal foi fechado antes dele chegar', async () => {
    let rejeitarPrimeira: (err: Error) => void
    const primeiraPromise = new Promise<Atleta[]>((_resolve, reject) => {
      rejeitarPrimeira = reject
    })
    const segundaPromise = new Promise<Atleta[]>(() => {})

    vi.spyOn(atletasApi, 'listarTodosAtletas')
      .mockReturnValueOnce(primeiraPromise)
      .mockReturnValueOnce(segundaPromise)

    const { rerender } = renderModal({ aberto: true })

    rerender(
      <MemoryRouter>
        <ModalCompararJogador atletaOrigem={atletaOrigem} aberto={false} onFechar={vi.fn()} />
      </MemoryRouter>,
    )

    await act(async () => {
      rejeitarPrimeira!(new Error('Erro tardio'))
      await primeiraPromise.catch(() => {})
    })

    rerender(
      <MemoryRouter>
        <ModalCompararJogador atletaOrigem={atletaOrigem} aberto={true} onFechar={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Carregando jogadores…')).toBeInTheDocument()
  })

  it('busca os atletas ao abrir o modal mesmo se montado inicialmente fechado', async () => {
    const { rerender } = renderModal({ aberto: false })

    expect(atletasApi.listarTodosAtletas).not.toHaveBeenCalled()

    rerender(
      <MemoryRouter>
        <ModalCompararJogador atletaOrigem={atletaOrigem} aberto={true} onFechar={vi.fn()} />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })
    expect(atletasApi.listarTodosAtletas).toHaveBeenCalledTimes(1)
  })

  it('não fecha o modal ao pressionar uma tecla diferente de Escape', async () => {
    const onFechar = vi.fn()
    renderModal({ onFechar })

    await waitFor(() => screen.getByText('Garro'))

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onFechar).not.toHaveBeenCalled()
  })

  it('remove o listener de keydown ao fechar o modal (cleanup do efeito de Escape)', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const onFechar = vi.fn()
    const { rerender } = renderModal({ onFechar })

    await waitFor(() => screen.getByText('Garro'))

    rerender(
      <MemoryRouter>
        <ModalCompararJogador atletaOrigem={atletaOrigem} aberto={false} onFechar={onFechar} />
      </MemoryRouter>,
    )

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  it('atualiza o listener de Escape quando a referência de onFechar muda', async () => {
    const onFechar1 = vi.fn()
    const onFechar2 = vi.fn()
    const { rerender } = renderModal({ onFechar: onFechar1 })

    await waitFor(() => screen.getByText('Garro'))

    rerender(
      <MemoryRouter>
        <ModalCompararJogador atletaOrigem={atletaOrigem} aberto={true} onFechar={onFechar2} />
      </MemoryRouter>,
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onFechar2).toHaveBeenCalledTimes(1)
    expect(onFechar1).not.toHaveBeenCalled()
  })

  it('desmarcar uma posição remove somente ela, mantendo as demais selecionadas', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Goleiro (GOL)'))
    await user.click(screen.getByText('Atacante (ATA)'))

    await waitFor(() => {
      expect(screen.getByText('Weverton')).toBeInTheDocument() // GOL
      expect(screen.getByText('Pedro')).toBeInTheDocument() // ATA
      expect(screen.queryByText('Garro')).not.toBeInTheDocument() // MEI excluído
    })

    // Desmarca apenas GOL
    await user.click(screen.getByText('Goleiro (GOL)'))

    await waitFor(() => {
      expect(screen.queryByText('Weverton')).not.toBeInTheDocument()
      expect(screen.getByText('Pedro')).toBeInTheDocument() // ATA continua selecionado
    })
  })

  it('reseta para a página 1 ao alterar o filtro de posição enquanto estava em outra página', async () => {
    const muitosAtletas: Atleta[] = Array.from({ length: 20 }, (_, i) => ({
      ...atletaOrigem,
      id: 1200 + i,
      nome: `Zagueiro ${i + 1}`,
      posicao: 'ZAG',
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(muitosAtletas)
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => expect(screen.getByText('Zagueiro 1')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Próxima/i }))
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Zagueiro (ZAG)'))

    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument()
  })

  it('desmarcar um status remove somente ele, mantendo os demais selecionados', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Provável'))
    await user.click(screen.getByText('Dúvida'))

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument() // provavel
      expect(screen.getByText('Pedro')).toBeInTheDocument() // duvida
      expect(screen.queryByText('Weverton')).not.toBeInTheDocument() // suspenso
    })

    // Desmarca apenas Dúvida
    await user.click(screen.getByText('Dúvida'))

    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument() // provavel continua
      expect(screen.queryByText('Pedro')).not.toBeInTheDocument() // duvida removido
      expect(screen.queryByText('Weverton')).not.toBeInTheDocument()
    })
  })

  it('reseta para a página 1 ao alterar o filtro de status enquanto estava em outra página', async () => {
    const muitosAtletas: Atleta[] = Array.from({ length: 20 }, (_, i) => ({
      ...atletaOrigem,
      id: 1300 + i,
      nome: `Suspenso ${i + 1}`,
      status_nome: 'suspenso',
      status_id: 3,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(muitosAtletas)
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => expect(screen.getByText('Suspenso 1')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Próxima/i }))
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Suspenso'))

    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument()
  })

  it('ignora espaços em branco extras ao filtrar por nome (trim antes de comparar)', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    const inputBusca = screen.getByPlaceholderText(/Buscar por nome…/i)
    await user.type(inputBusca, '  Pedro  ')

    await waitFor(() => {
      expect(screen.getByText('Pedro')).toBeInTheDocument()
      expect(screen.queryByText('Garro')).not.toBeInTheDocument()
    })
  })

  it('coloca Overall null sempre por último na ordenação crescente e decrescente', async () => {
    const atletaSemOverall: Atleta = {
      ...atletaOrigem,
      id: 700,
      nome: 'SemOverall',
      overall_score: null,
    }
    const atletaComOverall0: Atleta = {
      ...atletaOrigem,
      id: 701,
      nome: 'OverallZero',
      overall_score: 0,
    }
    const atletaComOverall80: Atleta = {
      ...atletaOrigem,
      id: 702,
      nome: 'OverallOitenta',
      overall_score: 80,
    }
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      atletaSemOverall,
      atletaComOverall0,
      atletaComOverall80,
    ])

    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('SemOverall'))

    // Primeiro clique: descending (padrão)
    await user.click(screen.getByRole('button', { name: /^Overall:/i }))

    let linhas = screen
      .getAllByRole('button')
      .filter((el) => el.classList.contains('modal-table-row'))
    // Descending: 80, 0, null
    expect(within(linhas[0]).getByText('OverallOitenta')).toBeInTheDocument()
    expect(within(linhas[1]).getByText('OverallZero')).toBeInTheDocument()
    expect(within(linhas[2]).getByText('SemOverall')).toBeInTheDocument()

    // Segundo clique: ascending
    await user.click(screen.getByRole('button', { name: /^Overall.*decrescente/i }))

    linhas = screen
      .getAllByRole('button')
      .filter((el) => el.classList.contains('modal-table-row'))
    // Ascending: 0, 80, null
    expect(within(linhas[0]).getByText('OverallZero')).toBeInTheDocument()
    expect(within(linhas[1]).getByText('OverallOitenta')).toBeInTheDocument()
    expect(within(linhas[2]).getByText('SemOverall')).toBeInTheDocument()
  })

  it('ordena corretamente com Overall negativo, mantendo null sempre por último', async () => {
    const atletaSemOverall: Atleta = {
      ...atletaOrigem,
      id: 700,
      nome: 'SemOverall',
      overall_score: null,
    }
    const atletaComOverallNegativo: Atleta = {
      ...atletaOrigem,
      id: 701,
      nome: 'OverallNegativo',
      overall_score: -0.5,
    }
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      atletaSemOverall,
      atletaComOverallNegativo,
    ])

    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('SemOverall'))

    // Primeiro clique: descending
    await user.click(screen.getByRole('button', { name: /^Overall:/i }))

    let linhas = screen
      .getAllByRole('button')
      .filter((el) => el.classList.contains('modal-table-row'))
    // Descending: -0.5 (OverallNegativo) vem primeiro, null sempre último
    expect(within(linhas[0]).getByText('OverallNegativo')).toBeInTheDocument()
    expect(within(linhas[1]).getByText('SemOverall')).toBeInTheDocument()

    // Segundo clique: ascending
    await user.click(screen.getByRole('button', { name: /^Overall.*decrescente/i }))

    linhas = screen
      .getAllByRole('button')
      .filter((el) => el.classList.contains('modal-table-row'))
    // Ascending: -0.5 (OverallNegativo) vem primeiro (é menor), null sempre último
    expect(within(linhas[0]).getByText('OverallNegativo')).toBeInTheDocument()
    expect(within(linhas[1]).getByText('SemOverall')).toBeInTheDocument()
  })

  it('ordena corretamente por média casa isoladamente (accessor correto)', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    await user.click(screen.getByRole('button', { name: /^Média casa:/i }))

    const linhas = screen
      .getAllByRole('button')
      .filter((el) => el.classList.contains('modal-table-row'))
    // média_casa desc: Pedro (9.0) > Garro (7.4) > Weverton (6.0)
    expect(within(linhas[0]).getByText('Pedro')).toBeInTheDocument()
    expect(within(linhas[1]).getByText('Garro')).toBeInTheDocument()
    expect(within(linhas[2]).getByText('Weverton')).toBeInTheDocument()
  })

  it('ordena corretamente por média fora isoladamente (accessor correto)', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    await user.click(screen.getByRole('button', { name: /^Média fora:/i }))

    const linhas = screen
      .getAllByRole('button')
      .filter((el) => el.classList.contains('modal-table-row'))
    // média_fora desc: Pedro (7.2) > Garro (6.2) > Weverton (5.0)
    expect(within(linhas[0]).getByText('Pedro')).toBeInTheDocument()
    expect(within(linhas[1]).getByText('Garro')).toBeInTheDocument()
    expect(within(linhas[2]).getByText('Weverton')).toBeInTheDocument()
  })

  it('mostra prioridade e direção corretos nos cabeçalhos ao ordenar por múltiplos critérios', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    const btnPreco = screen.getByRole('button', { name: /^Preço:/i })
    const btnCasa = screen.getByRole('button', { name: /^Média casa:/i })
    const btnFora = screen.getByRole('button', { name: /^Média fora:/i })
    const btnOverall = screen.getByRole('button', { name: /^Overall:/i })

    expect(btnPreco).toHaveAccessibleName('Preço: sem ordenação')

    await user.click(btnPreco)
    expect(btnPreco).toHaveAccessibleName('Preço: decrescente, prioridade 1')

    await user.click(btnCasa)
    expect(btnCasa).toHaveAccessibleName('Média casa: decrescente, prioridade 2')

    await user.click(btnFora)
    expect(btnFora).toHaveAccessibleName('Média fora: decrescente, prioridade 3')

    await user.click(btnOverall)
    expect(btnOverall).toHaveAccessibleName('Overall: decrescente, prioridade 4')

    // Clicar de novo em Preço alterna para crescente, mantendo prioridade 1
    await user.click(btnPreco)
    expect(btnPreco).toHaveAccessibleName('Preço: crescente, prioridade 1')

    // Terceiro clique em Preço remove esse critério; os demais recalculam prioridade
    await user.click(btnPreco)
    expect(btnPreco).toHaveAccessibleName('Preço: sem ordenação')
    expect(btnCasa).toHaveAccessibleName('Média casa: decrescente, prioridade 1')
    expect(btnFora).toHaveAccessibleName('Média fora: decrescente, prioridade 2')
    expect(btnOverall).toHaveAccessibleName('Overall: decrescente, prioridade 3')
  })

  it('reseta para a página 1 ao digitar no campo de busca enquanto estava em outra página', async () => {
    const muitosAtletas: Atleta[] = Array.from({ length: 20 }, (_, i) => ({
      ...atletaOrigem,
      id: 1400 + i,
      nome: `Buscavel ${i + 1}`,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(muitosAtletas)
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Buscavel 1'))

    await user.click(screen.getByRole('button', { name: /Próxima/i }))
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument()

    const inputBusca = screen.getByPlaceholderText(/Buscar por nome…/i)
    fireEvent.change(inputBusca, { target: { value: 'Buscavel' } })

    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument()
  })

  it('permite filtrar pelos status Suspenso, Contundido e Nulo, corretamente rotulados', async () => {
    const atletaContundido: Atleta = {
      ...atletaOrigem,
      id: 501,
      nome: 'Contundido1',
      status_nome: 'contundido',
      status_id: 5,
    }
    const atletaNulo: Atleta = {
      ...atletaOrigem,
      id: 502,
      nome: 'Nulo1',
      status_nome: 'nulo',
      status_id: 6,
    }
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      ...listaAtletasMock,
      atletaContundido,
      atletaNulo,
    ])

    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Weverton'))

    await user.click(screen.getByRole('button', { name: /Status/i }))
    expect(screen.getByText('Suspenso')).toBeInTheDocument()
    expect(screen.getByText('Contundido')).toBeInTheDocument()
    expect(screen.getByText('Nulo')).toBeInTheDocument()

    await user.click(screen.getByText('Suspenso'))
    await waitFor(() => {
      expect(screen.getByText('Weverton')).toBeInTheDocument()
      expect(screen.queryByText('Garro')).not.toBeInTheDocument()
      expect(screen.queryByText('Contundido1')).not.toBeInTheDocument()
      expect(screen.queryByText('Nulo1')).not.toBeInTheDocument()
    })

    // Desmarca Suspenso e marca Contundido
    await user.click(screen.getByText('Suspenso'))
    await user.click(screen.getByText('Contundido'))
    await waitFor(() => {
      expect(screen.getByText('Contundido1')).toBeInTheDocument()
      expect(screen.queryByText('Weverton')).not.toBeInTheDocument()
    })

    // Desmarca Contundido e marca Nulo
    await user.click(screen.getByText('Contundido'))
    await user.click(screen.getByText('Nulo'))
    await waitFor(() => {
      expect(screen.getByText('Nulo1')).toBeInTheDocument()
      expect(screen.queryByText('Contundido1')).not.toBeInTheDocument()
    })
  })

  it('limpa os filtros de status ao clicar em "Limpar" no dropdown de Status', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Dúvida'))
    await waitFor(() => {
      expect(screen.getByText('Pedro')).toBeInTheDocument()
      expect(screen.queryByText('Garro')).not.toBeInTheDocument()
    })

    await user.click(screen.getByText('Limpar'))
    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
      expect(screen.getByText('Pedro')).toBeInTheDocument()
      expect(screen.getByText('Weverton')).toBeInTheDocument()
    })
  })

  it('reseta a página ao limpar o filtro de status enquanto estava em outra página', async () => {
    const atletas: Atleta[] = Array.from({ length: 30 }, (_, i) => ({
      ...atletaOrigem,
      id: 1500 + i,
      nome: `Atleta ${i + 1}`,
      status_nome: i < 20 ? 'duvida' : 'provavel',
      status_id: i < 20 ? 2 : 7,
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(atletas)
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Atleta 1'))

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Dúvida'))
    await waitFor(() => screen.getByText(/Página 1 de 2/i))

    await user.click(screen.getByRole('button', { name: /Próxima/i }))
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Limpar'))

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument()
    })
  })

  it('permite filtrar pelas posições ZAG, LAT, MEI, ATA e TEC, corretamente rotuladas', async () => {
    const atletas: Atleta[] = [
      { ...atletaOrigem, id: 601, nome: 'Zagueiro1', posicao: 'ZAG' },
      { ...atletaOrigem, id: 602, nome: 'Lateral1', posicao: 'LAT' },
      { ...atletaOrigem, id: 603, nome: 'Meia1', posicao: 'MEI' },
      { ...atletaOrigem, id: 604, nome: 'Atacante1', posicao: 'ATA' },
      { ...atletaOrigem, id: 605, nome: 'Tecnico1', posicao: 'TEC' },
    ]
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(atletas)

    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Zagueiro1'))

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    for (const label of [
      'Zagueiro (ZAG)',
      'Lateral (LAT)',
      'Meia (MEI)',
      'Atacante (ATA)',
      'Técnico (TEC)',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }

    await user.click(screen.getByText('Zagueiro (ZAG)'))
    await waitFor(() => {
      expect(screen.getByText('Zagueiro1')).toBeInTheDocument()
      expect(screen.queryByText('Lateral1')).not.toBeInTheDocument()
    })

    await user.click(screen.getByText('Zagueiro (ZAG)'))
    await user.click(screen.getByText('Lateral (LAT)'))
    await waitFor(() => {
      expect(screen.getByText('Lateral1')).toBeInTheDocument()
      expect(screen.queryByText('Zagueiro1')).not.toBeInTheDocument()
    })

    await user.click(screen.getByText('Lateral (LAT)'))
    await user.click(screen.getByText('Meia (MEI)'))
    await waitFor(() => {
      expect(screen.getByText('Meia1')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Meia (MEI)'))
    await user.click(screen.getByText('Atacante (ATA)'))
    await waitFor(() => {
      expect(screen.getByText('Atacante1')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Atacante (ATA)'))
    await user.click(screen.getByText('Técnico (TEC)'))
    await waitFor(() => {
      expect(screen.getByText('Tecnico1')).toBeInTheDocument()
    })
  })

  it('limpa os filtros de posição ao clicar em "Limpar" no dropdown de Posição', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Goleiro (GOL)'))
    await waitFor(() => {
      expect(screen.getByText('Weverton')).toBeInTheDocument()
      expect(screen.queryByText('Garro')).not.toBeInTheDocument()
    })

    await user.click(screen.getByText('Limpar'))
    await waitFor(() => {
      expect(screen.getByText('Garro')).toBeInTheDocument()
      expect(screen.getByText('Pedro')).toBeInTheDocument()
      expect(screen.getByText('Weverton')).toBeInTheDocument()
    })
  })

  it('reseta a página ao limpar o filtro de posição enquanto estava em outra página', async () => {
    const atletas: Atleta[] = Array.from({ length: 30 }, (_, i) => ({
      ...atletaOrigem,
      id: 1600 + i,
      nome: `Jogador ${i + 1}`,
      posicao: i < 20 ? 'ZAG' : 'ATA',
    }))
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue(atletas)
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Jogador 1'))

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Zagueiro (ZAG)'))
    await waitFor(() => screen.getByText(/Página 1 de 2/i))

    await user.click(screen.getByRole('button', { name: /Próxima/i }))
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Posição/i }))
    await user.click(screen.getByText('Limpar'))

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument()
    })
  })

  it('mostra "Carregando jogadores…" enquanto os dados ainda não chegaram, sem lista nem mensagem vazia', async () => {
    let resolver: (value: Atleta[]) => void
    const pendente = new Promise<Atleta[]>((resolve) => {
      resolver = resolve
    })
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockReturnValue(pendente)

    renderModal()

    expect(screen.getByText('Carregando jogadores…')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum jogador encontrado.')).not.toBeInTheDocument()
    expect(screen.queryByText('Jogador')).not.toBeInTheDocument()

    await act(async () => {
      resolver!(listaAtletasMock)
      await pendente
    })

    await waitFor(() => {
      expect(screen.queryByText('Carregando jogadores…')).not.toBeInTheDocument()
      expect(screen.getByText('Garro')).toBeInTheDocument()
    })
  })

  it('mostra "Nenhum jogador encontrado" quando o filtro não retorna resultados, sem mostrar a tabela', async () => {
    const user = userEvent.setup()
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    const inputBusca = screen.getByPlaceholderText(/Buscar por nome…/i)
    await user.type(inputBusca, 'NomeQueNaoExisteXYZ')

    await waitFor(() => {
      expect(screen.getByText('Nenhum jogador encontrado.')).toBeInTheDocument()
      expect(screen.queryByText('Garro')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Carregando jogadores…')).not.toBeInTheDocument()
    expect(screen.queryByText('Jogador')).not.toBeInTheDocument()
  })

  it('aplica o estilo de centralização na coluna "St" e na badge de status da linha', async () => {
    renderModal()

    await waitFor(() => screen.getByText('Garro'))

    const stHeader = screen.getByTitle('Status no mercado')
    expect(stHeader).toHaveStyle({ textAlign: 'center' })

    const linhaGarro = screen.getByText('Garro').closest<HTMLElement>('[role="button"]')!
    const badgeGarro = within(linhaGarro).getByLabelText('Provável')
    expect(badgeGarro.parentElement).toHaveStyle({ display: 'flex', justifyContent: 'center' })
  })

  it('não seleciona o atleta ao pressionar uma tecla diferente de Enter ou Espaço', async () => {
    renderModal()

    await waitFor(() => screen.getByText('Pedro'))
    const linhaPedro = screen.getByText('Pedro').closest('[role="button"]')!
    fireEvent.keyDown(linhaPedro, { key: 'a' })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('permite selecionar um atleta pressionando a tecla Espaço na linha', async () => {
    const onFechar = vi.fn()
    renderModal({ onFechar })

    await waitFor(() => screen.getByText('Pedro'))
    const linhaPedro = screen.getByText('Pedro').closest('[role="button"]')!
    fireEvent.keyDown(linhaPedro, { key: ' ' })

    expect(mockNavigate).toHaveBeenCalledWith('/comparar?a=100&b=300')
    expect(onFechar).toHaveBeenCalled()
  })

  it('previne o comportamento padrão do navegador ao selecionar via teclado (Espaço)', async () => {
    renderModal()

    await waitFor(() => screen.getByText('Pedro'))
    const linhaPedro = screen.getByText('Pedro').closest('[role="button"]')!
    const evento = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    linhaPedro.dispatchEvent(evento)

    expect(evento.defaultPrevented).toBe(true)
  })
})
