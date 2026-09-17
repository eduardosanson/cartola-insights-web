import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CurvaTransicao from './CurvaTransicao'
import { formatCurrency } from '../utils/formatNumber'

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

    // Rodada e valor unicos => minRodada===maxRodada e minValor===maxValor,
    // então escalaX/escalaY usam o ramo "ponto central" (largura/altura util / 2),
    // ignorando o argumento recebido.
    const circle = container.querySelector('circle')
    expect(circle).toHaveAttribute('cx', '380')
    expect(circle).toHaveAttribute('cy', '140')
  })

  it('calcula a geometria exata da curva (path, pontos, eixo e viewBox)', () => {
    const pontos = [
      { rodada: 1, variacao_media: -4 },
      { rodada: 3, variacao_media: 0 },
      { rodada: 5, variacao_media: 4 },
    ]
    const { container } = render(<CurvaTransicao pontos={pontos} />)

    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 720 300')

    const path = container.querySelector('path.curva-linha')
    expect(path).toHaveAttribute('d', 'M 64 256 L 380 140 L 696 24')

    const eixo = container.querySelector('line.curva-eixo')
    expect(eixo).toHaveAttribute('x1', '64')
    expect(eixo).toHaveAttribute('x2', '696')
    expect(eixo).toHaveAttribute('y1', '140')
    expect(eixo).toHaveAttribute('y2', '140')

    const faixa = screen.getByTestId('faixa-rodadas-iniciais')
    expect(faixa).toHaveAttribute('x', '64')
    expect(faixa).toHaveAttribute('y', '24')
    expect(faixa).toHaveAttribute('width', '632')
    expect(faixa).toHaveAttribute('height', '232')

    const circulos = container.querySelectorAll('circle')
    expect(circulos).toHaveLength(3)
    expect(circulos[0]).toHaveAttribute('cx', '64')
    expect(circulos[0]).toHaveAttribute('cy', '256')
    expect(circulos[1]).toHaveAttribute('cx', '380')
    expect(circulos[1]).toHaveAttribute('cy', '140')
    expect(circulos[2]).toHaveAttribute('cx', '696')
    expect(circulos[2]).toHaveAttribute('cy', '24')

    const textos = container.querySelectorAll('text')
    expect(textos).toHaveLength(3)
    expect(textos[0]).toHaveTextContent('R1')
    expect(textos[1]).toHaveTextContent('R3')
    expect(textos[2]).toHaveTextContent('R5')
    textos.forEach((texto) => expect(texto).toHaveAttribute('y', '284'))

    const titulos = container.querySelectorAll('title')
    expect(titulos).toHaveLength(3)
    expect(titulos[0]).toHaveTextContent(`Rodada 1: ${formatCurrency(-4)}`)
    expect(titulos[1]).toHaveTextContent(`Rodada 3: ${formatCurrency(0)}`)
    expect(titulos[2]).toHaveTextContent(`Rodada 5: ${formatCurrency(4)}`)
  })

  it('calcula inicio e fim da faixa quando as rodadas ficam fora do intervalo 1-5', () => {
    const pontos = [
      { rodada: 3, variacao_media: 0 },
      { rodada: 11, variacao_media: 0 },
    ]
    render(<CurvaTransicao pontos={pontos} />)

    const faixa = screen.getByTestId('faixa-rodadas-iniciais')
    expect(faixa).toHaveAttribute('x', '64')
    expect(faixa).toHaveAttribute('y', '24')
    expect(faixa).toHaveAttribute('width', '158')
    expect(faixa).toHaveAttribute('height', '232')
  })

  it('nao exibe a faixa quando todas as rodadas sao posteriores a rodada 5', () => {
    const pontos = [
      { rodada: 10, variacao_media: 0 },
      { rodada: 15, variacao_media: 0 },
    ]
    render(<CurvaTransicao pontos={pontos} />)

    expect(screen.queryByTestId('faixa-rodadas-iniciais')).not.toBeInTheDocument()
  })

  it('nao exibe a faixa quando todas as rodadas sao anteriores a rodada 1', () => {
    const pontos = [
      { rodada: -5, variacao_media: 0 },
      { rodada: -2, variacao_media: 0 },
    ]
    render(<CurvaTransicao pontos={pontos} />)

    expect(screen.queryByTestId('faixa-rodadas-iniciais')).not.toBeInTheDocument()
  })

  it('exibe a faixa quando a maior rodada e exatamente 1', () => {
    const pontos = [{ rodada: 1, variacao_media: 0 }]
    render(<CurvaTransicao pontos={pontos} />)

    expect(screen.getByTestId('faixa-rodadas-iniciais')).toBeInTheDocument()
  })

  it('exibe a faixa quando a menor rodada e exatamente 5', () => {
    const pontos = [
      { rodada: 5, variacao_media: 0 },
      { rodada: 9, variacao_media: 0 },
    ]
    render(<CurvaTransicao pontos={pontos} />)

    expect(screen.getByTestId('faixa-rodadas-iniciais')).toBeInTheDocument()
  })
})
