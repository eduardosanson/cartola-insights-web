import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CurvaTransicao from './CurvaTransicao'

describe('CurvaTransicao', () => {
  it('destaca explicitamente as rodadas 1 a 5', () => {
    render(
      <CurvaTransicao
        pontos={Array.from({ length: 8 }, (_, indice) => ({
          rodada: indice + 1,
          variacao_media: indice / 10 - 0.3,
        }))}
      />,
    )

    const faixa = screen.getByTestId('faixa-rodadas-iniciais')
    expect(faixa).toHaveAttribute('data-rodada-inicio', '1')
    expect(faixa).toHaveAttribute('data-rodada-fim', '5')
    expect(screen.getByRole('img')).toHaveStyle({ maxWidth: '100%', height: 'auto' })
  })

  it('lida com curva vazia', () => {
    render(<CurvaTransicao pontos={[]} />)
    expect(screen.getByText(/nenhum histórico/i)).toBeInTheDocument()
  })

  it('lida com um unico ponto sem coordenadas invalidas', () => {
    const { container } = render(
      <CurvaTransicao pontos={[{ rodada: 3, variacao_media: 0 }]} />,
    )
    expect(container.innerHTML).not.toContain('NaN')
    expect(container.innerHTML).not.toContain('Infinity')
  })
})
