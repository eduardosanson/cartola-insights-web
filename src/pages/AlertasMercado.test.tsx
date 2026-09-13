import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as atletasApi from '../api/atletas'
import * as mercadoApi from '../api/mercado'
import * as otimizadorApi from '../api/otimizador'
import AlertasMercado from './AlertasMercado'

const alteracao: mercadoApi.StatusAlterado = {
  atleta_id: 10,
  status_id: 5,
  atualizado_em: '2026-08-25T13:00:00Z',
}

const substituto: otimizadorApi.SubstitutoSugerido = {
  atleta_id: 11,
  posicao: 'ATA',
  preco: 8.5,
  score: 7.2,
  media_geral: 6,
  chance_pontuar_percentual: 80,
  fator_confronto: 1.2,
  proximo_confronto: {
    atleta_id: 11,
    posicao: 'ATA',
    rodada: 25,
    mando: 'casa',
    clube_adversario_id: 2,
    clube_adversario_nome: 'Adversário',
    media_no_mando: 7,
    pontos_cedidos_adversario: 5,
    participacao_pontuacao_time_media: 20,
    veredito: 'referencia_do_time',
  },
}

describe('AlertasMercado', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(mercadoApi, 'buscarStatusAlterados').mockResolvedValue([alteracao])
    vi.spyOn(otimizadorApi, 'buscarSubstituto').mockResolvedValue(substituto)
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation(async (id) => ({
      id,
      nome: `Atleta ${id}`,
    }) as atletasApi.Atleta)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  })

  it('consulta ao montar e de novo quando a aba volta a ficar visível, sem polling', async () => {
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    await waitFor(() => expect(mercadoApi.buscarStatusAlterados).toHaveBeenCalledTimes(1))
    intervalSpy.mockClear()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    fireEvent(document, new Event('visibilitychange'))
    expect(mercadoApi.buscarStatusAlterados).toHaveBeenCalledTimes(1)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    fireEvent(document, new Event('visibilitychange'))
    expect(mercadoApi.buscarStatusAlterados).toHaveBeenCalledTimes(2)
    expect(intervalSpy).not.toHaveBeenCalled()
    const [primeiroDesde] = vi.mocked(mercadoApi.buscarStatusAlterados).mock.calls[0]
    const [segundoDesde] = vi.mocked(mercadoApi.buscarStatusAlterados).mock.calls[1]
    expect(segundoDesde.getTime()).toBeGreaterThanOrEqual(primeiroDesde.getTime())
  })

  it('busca substituto somente depois do clique e mostra os dados retornados', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Atleta 10')).toBeInTheDocument()
    expect(screen.getByText('Contundido')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Atleta 10' })).toHaveAttribute(
      'href',
      '/jogadores/10',
    )
    expect(
      screen.queryByText(/nenhum substituto direto encontrado nessa faixa de preço/i),
    ).not.toBeInTheDocument()
    expect(otimizadorApi.buscarSubstituto).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /ver substituto sugerido/i }))

    expect(otimizadorApi.buscarSubstituto).toHaveBeenCalledWith(10)
    expect(await screen.findByText(/Atleta 11/)).toBeInTheDocument()
    expect(screen.getByText(/C\$ 8,50/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Atleta 11/ })).toHaveAttribute(
      'href',
      '/jogadores/11',
    )
    expect(
      screen.queryByText(/nenhum substituto direto encontrado nessa faixa de preço/i),
    ).not.toBeInTheDocument()
  })

  it('mostra os rótulos de status mapeados para cada status_id conhecido', async () => {
    vi.mocked(mercadoApi.buscarStatusAlterados).mockResolvedValue([
      { atleta_id: 1, status_id: 2, atualizado_em: '2026-08-25T13:00:00Z' },
      { atleta_id: 2, status_id: 3, atualizado_em: '2026-08-25T13:00:00Z' },
      { atleta_id: 3, status_id: 5, atualizado_em: '2026-08-25T13:00:00Z' },
      { atleta_id: 4, status_id: 6, atualizado_em: '2026-08-25T13:00:00Z' },
    ])
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Dúvida')).toBeInTheDocument()
    expect(screen.getByText('Suspenso')).toBeInTheDocument()
    expect(screen.getByText('Contundido')).toBeInTheDocument()
    expect(screen.getByText('Nulo')).toBeInTheDocument()
  })

  it('mostra o aviso de verificação inicial e o esconde assim que a checagem conclui', async () => {
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    expect(screen.getByText('Verificando mudanças de status…')).toBeInTheDocument()
    expect(await screen.findByText('Atleta 10')).toBeInTheDocument()
    expect(screen.queryByText('Verificando mudanças de status…')).not.toBeInTheDocument()
  })

  it('desabilita o botão e troca o rótulo enquanto a busca do substituto está em andamento', async () => {
    let liberarBusca!: (valor: otimizadorApi.SubstitutoSugerido | null) => void
    vi.spyOn(otimizadorApi, 'buscarSubstituto').mockImplementation(
      () =>
        new Promise((resolve) => {
          liberarBusca = resolve
        }),
    )
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    const botaoInicial = await screen.findByRole('button', { name: 'Ver substituto sugerido' })
    expect(botaoInicial).not.toBeDisabled()
    await user.click(botaoInicial)

    const botaoCarregando = await screen.findByRole('button', { name: 'Buscando substituto…' })
    expect(botaoCarregando).toBeDisabled()

    liberarBusca(substituto)
    const botaoFinal = await screen.findByRole('button', { name: 'Ver substituto sugerido' })
    expect(botaoFinal).not.toBeDisabled()
  })

  it('avança a marca de última checagem só quando a nova checagem é mais recente, nunca retrocede', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const t0 = new Date('2026-01-01T00:00:00.000Z')
      vi.setSystemTime(t0)
      render(
        <MemoryRouter>
          <AlertasMercado />
        </MemoryRouter>,
      )
      await waitFor(() => expect(mercadoApi.buscarStatusAlterados).toHaveBeenCalledTimes(1))
      const [desde1] = vi.mocked(mercadoApi.buscarStatusAlterados).mock.calls[0]
      expect(desde1.getTime()).toBe(t0.getTime())

      const t1 = new Date('2026-01-01T00:00:10.000Z')
      vi.setSystemTime(t1)
      fireEvent(document, new Event('visibilitychange'))
      await waitFor(() => expect(mercadoApi.buscarStatusAlterados).toHaveBeenCalledTimes(2))
      const [desde2] = vi.mocked(mercadoApi.buscarStatusAlterados).mock.calls[1]
      expect(desde2.getTime()).toBe(t0.getTime())

      const tRegressao = new Date('2026-01-01T00:00:05.000Z')
      vi.setSystemTime(tRegressao)
      fireEvent(document, new Event('visibilitychange'))
      await waitFor(() => expect(mercadoApi.buscarStatusAlterados).toHaveBeenCalledTimes(3))
      const [desde3] = vi.mocked(mercadoApi.buscarStatusAlterados).mock.calls[2]
      expect(desde3.getTime()).toBe(t1.getTime())

      const t2 = new Date('2026-01-01T00:00:20.000Z')
      vi.setSystemTime(t2)
      fireEvent(document, new Event('visibilitychange'))
      await waitFor(() => expect(mercadoApi.buscarStatusAlterados).toHaveBeenCalledTimes(4))
      const [desde4] = vi.mocked(mercadoApi.buscarStatusAlterados).mock.calls[3]
      expect(desde4.getTime()).toBe(t1.getTime())
    } finally {
      vi.useRealTimers()
    }
  })

  it('mostra a mensagem de ausência quando o endpoint retorna 404 mapeado para null', async () => {
    vi.mocked(otimizadorApi.buscarSubstituto).mockResolvedValue(null)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /ver substituto sugerido/i }))
    expect(
      await screen.findByText(/nenhum substituto direto encontrado nessa faixa de preço/i),
    ).toBeInTheDocument()
  })

  it('mostra estado vazio quando não houve mudança', async () => {
    vi.mocked(mercadoApi.buscarStatusAlterados).mockResolvedValue([])
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    expect(
      await screen.findByText(/nenhuma mudança de status desde a última checagem/i),
    ).toBeInTheDocument()
    expect(screen.queryByText('Verificando mudanças de status…')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('mantém IDs como fallback e mostra status desconhecido quando a hidratação falha', async () => {
    vi.mocked(mercadoApi.buscarStatusAlterados).mockResolvedValue([
      { ...alteracao, status_id: 99 },
    ])
    vi.mocked(atletasApi.buscarAtleta).mockRejectedValue(new Error('Atleta indisponível'))
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: 'Atleta #10' })).toBeInTheDocument()
    expect(screen.getByText('Status 99')).toBeInTheDocument()
  })

  it('mostra falhas da checagem e da busca de substituto sem quebrar o painel', async () => {
    vi.mocked(mercadoApi.buscarStatusAlterados)
      .mockRejectedValueOnce(new Error('Status indisponível'))
      .mockResolvedValueOnce([alteracao])
    const primeira = render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Status indisponível')
    expect(screen.queryByText('Verificando mudanças de status…')).not.toBeInTheDocument()
    const [desdeComFalha] = vi.mocked(mercadoApi.buscarStatusAlterados).mock.calls[0]
    fireEvent(document, new Event('visibilitychange'))
    await screen.findByText('Atleta 10')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const [desdeDoRetry] = vi.mocked(mercadoApi.buscarStatusAlterados).mock.calls[1]
    expect(desdeDoRetry).toEqual(desdeComFalha)
    primeira.unmount()

    vi.mocked(otimizadorApi.buscarSubstituto).mockRejectedValue(new Error('Substituto indisponível'))
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )
    await user.click(await screen.findByRole('button', { name: /ver substituto sugerido/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Substituto indisponível')
  })

  it('usa o ID do substituto quando a busca do nome falha', async () => {
    vi.mocked(atletasApi.buscarAtleta).mockImplementation(async (id) => {
      if (id === 11) throw new Error('Nome indisponível')
      return { id, nome: `Atleta ${id}` } as atletasApi.Atleta
    })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AlertasMercado />
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /ver substituto sugerido/i }))
    expect(await screen.findByRole('link', { name: 'Atleta #11' })).toBeInTheDocument()
  })
})
