import { fireEvent, render, screen } from '@testing-library/react'
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
})
