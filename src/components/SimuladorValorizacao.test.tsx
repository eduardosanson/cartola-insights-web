import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SimuladorValorizacao from './SimuladorValorizacao'
import * as mpvApi from '../api/mpv'

describe('SimuladorValorizacao', () => {
  beforeEach(() => {
    vi.spyOn(mpvApi, 'buscarMpvAtleta').mockResolvedValue({
      mpv_estimado: 2,
      faixa_preco: { min: 1, max: 10 },
      coeficientes: { a: 0.5, b: -1 },
      amostras: 35,
      confiavel: true,
    })
  })

  it('calcula a variacao no cliente sem nova chamada de rede', async () => {
    render(<SimuladorValorizacao atletaId={7} />)
    const slider = await screen.findByRole('slider', { name: /pontuação projetada/i })

    fireEvent.change(slider, { target: { value: '4' } })

    expect(screen.getByText('C$ 1,00')).toBeInTheDocument()
    expect(mpvApi.buscarMpvAtleta).toHaveBeenCalledTimes(1)
    expect(mpvApi.buscarMpvAtleta).toHaveBeenCalledWith(7)
  })

  it('nao projeta com amostra nao confiavel', async () => {
    vi.mocked(mpvApi.buscarMpvAtleta).mockResolvedValue({
      mpv_estimado: null,
      faixa_preco: { min: 1, max: 10 },
      coeficientes: { a: 0, b: 0 },
      amostras: 3,
      confiavel: false,
    })

    render(<SimuladorValorizacao atletaId={7} />)

    expect(await screen.findByText(/dados insuficientes/i)).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('nao projeta quando o MPV estimado e nulo mesmo se confiavel', async () => {
    vi.mocked(mpvApi.buscarMpvAtleta).mockResolvedValue({
      mpv_estimado: null,
      faixa_preco: { min: 1, max: 10 },
      coeficientes: { a: 0.5, b: -1 },
      amostras: 35,
      confiavel: true,
    })

    render(<SimuladorValorizacao atletaId={7} />)

    expect(await screen.findByText(/dados insuficientes/i)).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('mostra falha do endpoint sem quebrar a pagina', async () => {
    vi.mocked(mpvApi.buscarMpvAtleta).mockRejectedValue(new Error('Falha de rede'))

    render(<SimuladorValorizacao atletaId={7} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede')
  })

  it('busca novos dados e reseta a pontuacao projetada quando o atletaId muda', async () => {
    const { rerender } = render(<SimuladorValorizacao atletaId={7} />)
    const sliderInicial = await screen.findByRole('slider', { name: /pontuação projetada/i })

    fireEvent.change(sliderInicial, { target: { value: '4' } })
    expect(screen.getByText('4,0')).toBeInTheDocument()

    rerender(<SimuladorValorizacao atletaId={8} />)

    await waitFor(() => {
      expect(screen.getByRole('slider')).toHaveAttribute('id', 'pontos-projetados-8')
    })

    expect(mpvApi.buscarMpvAtleta).toHaveBeenCalledTimes(2)
    expect(mpvApi.buscarMpvAtleta).toHaveBeenNthCalledWith(2, 8)
    expect(screen.getByRole('slider')).toHaveValue('0')
    expect(screen.getByText('0,0')).toBeInTheDocument()
  })

  it('ignora resposta tardia da chamada anterior quando o atletaId muda antes dela resolver', async () => {
    let resolverAntigo: ((valor: mpvApi.MpvAtleta) => void) | undefined
    const respostaAntiga = new Promise<mpvApi.MpvAtleta>((resolve) => {
      resolverAntigo = resolve
    })

    vi.mocked(mpvApi.buscarMpvAtleta).mockImplementation((id: number) =>
      id === 7
        ? respostaAntiga
        : Promise.resolve({
            mpv_estimado: 9,
            faixa_preco: { min: 1, max: 10 },
            coeficientes: { a: 1, b: 0 },
            amostras: 35,
            confiavel: true,
          }),
    )

    const { rerender } = render(<SimuladorValorizacao atletaId={7} />)
    expect(screen.getByText(/carregando estimativa/i)).toBeInTheDocument()

    rerender(<SimuladorValorizacao atletaId={8} />)
    await screen.findByRole('slider')

    resolverAntigo?.({
      mpv_estimado: 2,
      faixa_preco: { min: 1, max: 10 },
      coeficientes: { a: 0.5, b: -1 },
      amostras: 35,
      confiavel: true,
    })

    await waitFor(() => {
      expect(screen.getByRole('slider')).toHaveAttribute('id', 'pontos-projetados-8')
    })
    expect(screen.queryByText(/carregando estimativa/i)).not.toBeInTheDocument()
  })

  it('ignora erro tardio da chamada anterior quando o atletaId muda antes dela rejeitar', async () => {
    let rejeitarAntigo: ((erro: Error) => void) | undefined
    const respostaAntiga = new Promise<mpvApi.MpvAtleta>((_resolve, reject) => {
      rejeitarAntigo = reject
    })

    vi.mocked(mpvApi.buscarMpvAtleta).mockImplementation((id: number) =>
      id === 7
        ? respostaAntiga
        : Promise.resolve({
            mpv_estimado: 2,
            faixa_preco: { min: 1, max: 10 },
            coeficientes: { a: 0.5, b: -1 },
            amostras: 35,
            confiavel: true,
          }),
    )

    const { rerender } = render(<SimuladorValorizacao atletaId={7} />)
    expect(screen.getByText(/carregando estimativa/i)).toBeInTheDocument()

    rerender(<SimuladorValorizacao atletaId={8} />)
    await screen.findByRole('slider')

    rejeitarAntigo?.(new Error('Falha antiga'))

    await waitFor(() => {
      expect(screen.getByRole('slider')).toHaveAttribute('id', 'pontos-projetados-8')
    })
    expect(screen.queryByText(/carregando estimativa/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
