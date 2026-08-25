import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Patrimonio from './Patrimonio'
import * as mpvApi from '../api/mpv'

vi.mock('../components/AtletaAutocomplete', () => ({
  default: ({ onSelecionar }: { onSelecionar: (atleta: { id: number; nome: string }) => void }) => (
    <button onClick={() => onSelecionar({ id: 9, nome: 'Pedro' })}>Selecionar Pedro</button>
  ),
}))

vi.mock('../components/SimuladorValorizacao', () => ({
  default: ({ atletaId }: { atletaId: number }) => <div>Simulador do atleta {atletaId}</div>,
}))

describe('Patrimonio', () => {
  beforeEach(() => {
    vi.spyOn(mpvApi, 'buscarCurvaValorizacao').mockResolvedValue([
      { rodada: 1, variacao_media: -0.8 },
      { rodada: 2, variacao_media: 0.3 },
    ])
  })

  it('carrega a curva geral e reutiliza o autocomplete no simulador avulso', async () => {
    render(<Patrimonio />)

    expect(await screen.findByRole('img', { name: /curva histórica/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /selecionar pedro/i }))
    expect(screen.getByText('Simulador do atleta 9')).toBeInTheDocument()
    expect(mpvApi.buscarCurvaValorizacao).toHaveBeenCalledTimes(1)
  })

  it('mostra erro da curva sem esconder o simulador avulso', async () => {
    vi.mocked(mpvApi.buscarCurvaValorizacao).mockRejectedValue(new Error('Curva indisponível'))

    render(<Patrimonio />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Curva indisponível')
    expect(screen.getByRole('button', { name: /selecionar pedro/i })).toBeInTheDocument()
  })
})
