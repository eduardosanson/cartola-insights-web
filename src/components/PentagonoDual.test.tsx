import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PentagonoDual from './PentagonoDual'
import type { PercentisPadrao, PercentisGol } from '../api/percentis'

const percentisA: PercentisPadrao = {
  atleta_id: 1,
  pontuacao_media: 94,
  participacao_gol: 78,
  desarme: 62,
  disciplina: 68,
  media_basica: 85,
  overall_score: 77.4,
}

const percentisB: PercentisPadrao = {
  atleta_id: 2,
  pontuacao_media: 60,
  participacao_gol: 40,
  desarme: 55,
  disciplina: 72,
  media_basica: 50,
  overall_score: 55.4,
}

const percentisGol: PercentisGol = {
  atleta_id: 3,
  pontuacao_media: 88,
  defesas: 80,
  solidez_sg: 70,
  disciplina: 90,
  media_basica: 60,
  overall_score: 77.6,
}

describe('PentagonoDual', () => {
  it('renderiza dois polígonos de jogador (A e B) mais os 4 anéis de referência e o polígono da mediana', () => {
    render(<PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    expect(screen.getByTestId('anel-25')).toBeInTheDocument()
    expect(screen.getByTestId('anel-50')).toBeInTheDocument()
    expect(screen.getByTestId('anel-75')).toBeInTheDocument()
    expect(screen.getByTestId('anel-100')).toBeInTheDocument()
    expect(screen.getByTestId('pentagono-mediana')).toBeInTheDocument()

    const poligonosJogador = screen.getAllByTestId(/^pentagono-jogador-/)
    expect(poligonosJogador).toHaveLength(2)
  })

  it('usa classes/cores distintas para os dois polígonos de jogador (--accent-home para A, --accent-away para B)', () => {
    render(<PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    const poligonoA = screen.getByTestId('pentagono-jogador-a')
    expect(poligonoA).toHaveAttribute('data-atleta', 'a')
    expect(poligonoA).toHaveClass('pentagon-player-poly')

    const poligonoB = screen.getByTestId('pentagono-jogador-b')
    expect(poligonoB).toHaveAttribute('data-atleta', 'b')
    expect(poligonoB).toHaveClass('pentagon-player-poly-b')

    expect(poligonoA.className).not.toBe(poligonoB.className)
  })

  it('retorna null quando os dois atletas têm posições incompatíveis (um GOL, outro de linha)', () => {
    const { container } = render(
      <PentagonoDual percentisA={percentisGol} percentisB={percentisA} nomeA="Goleiro" nomeB="Atacante" />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('aplica os estilos exatos de layout ao wrapper e ao svg do diagrama', () => {
    const { container } = render(
      <PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />,
    )

    const wrap = container.querySelector('.diagram-wrap')
    expect(wrap).toHaveStyle({ position: 'relative' })

    const svgEl = screen.getByRole('img')
    expect(svgEl).toHaveStyle({
      maxWidth: '380px',
      height: 'auto',
      display: 'block',
      margin: '0 auto',
    })
  })

  it('define o aria-label do svg com os nomes exatos dos dois atletas', () => {
    render(<PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Pentágono de Qualidade comparando Atleta A e Atleta B',
    )
  })

  it('renderiza os 5 eixos radiais com as pontas exatas e os 5 rótulos com posição e texto exatos', () => {
    const { container } = render(
      <PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />,
    )

    const eixosLinhas = container.querySelectorAll('line.pentagon-axis')
    expect(eixosLinhas).toHaveLength(5)
    expect(eixosLinhas[0]).toHaveAttribute('x1', '170')
    expect(eixosLinhas[0]).toHaveAttribute('y1', '160')
    expect(eixosLinhas[0]).toHaveAttribute('x2', '170')
    expect(eixosLinhas[0]).toHaveAttribute('y2', '50')

    const rotulos = container.querySelectorAll('text.pentagon-label')
    expect(rotulos).toHaveLength(5)
    expect(rotulos[0]).toHaveTextContent('Poder de Fogo')
    expect(rotulos[0]).toHaveAttribute('x', '170')
    expect(rotulos[0]).toHaveAttribute('y', '36')
    expect(rotulos[0]).toHaveAttribute('text-anchor', 'middle')
  })

  it('calcula os pontos dos polígonos A e B como coordenadas numéricas válidas unidas por espaço', () => {
    render(<PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    const coordenadaValida = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/

    const pontosA = screen.getByTestId('pentagono-jogador-a').getAttribute('points')!.split(' ')
    expect(pontosA).toHaveLength(5)
    pontosA.forEach((ponto) => expect(ponto).toMatch(coordenadaValida))

    const pontosB = screen.getByTestId('pentagono-jogador-b').getAttribute('points')!.split(' ')
    expect(pontosB).toHaveLength(5)
    pontosB.forEach((ponto) => expect(ponto).toMatch(coordenadaValida))
  })

  it('aplica o fill de destaque (--accent-away) apenas nos vértices do jogador B', () => {
    render(<PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    expect(screen.getByTestId('vertice-a-0')).not.toHaveAttribute('style')
    expect(screen.getByTestId('vertice-b-0')).toHaveStyle({ fill: 'var(--accent-away)' })
  })

  it('exibe o número resumido de cada jogador apenas ao passar pelo respectivo vértice', () => {
    render(<PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByTestId('vertice-a-0'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Atleta A')
    expect(screen.getByRole('tooltip')).toHaveTextContent('Poder de Fogo')
    expect(screen.getByRole('tooltip')).toHaveTextContent('78')

    fireEvent.mouseLeave(screen.getByTestId('vertice-a-0'))
    fireEvent.mouseEnter(screen.getByTestId('vertice-b-0'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Atleta B')
    expect(screen.getByRole('tooltip')).toHaveTextContent('40')

    fireEvent.mouseLeave(screen.getByTestId('vertice-b-0'))
    fireEvent.focus(screen.getByTestId('vertice-a-1'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Atleta A')
    fireEvent.blur(screen.getByTestId('vertice-a-1'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('some com o tooltip ao tirar o mouse do vértice (onMouseLeave), sem precisar de blur', () => {
    render(<PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    fireEvent.mouseEnter(screen.getByTestId('vertice-a-0'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.mouseLeave(screen.getByTestId('vertice-a-0'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('define aria-label exato e aria-describedby só no vértice ativo (nem em outro índice, nem no outro jogador)', () => {
    render(<PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    const verticeA0 = screen.getByTestId('vertice-a-0')
    const verticeA1 = screen.getByTestId('vertice-a-1')
    const verticeB0 = screen.getByTestId('vertice-b-0')

    expect(verticeA0).toHaveAttribute('aria-label', 'Atleta A, Poder de Fogo: 78')
    expect(verticeA0).not.toHaveAttribute('aria-describedby')

    fireEvent.mouseEnter(verticeA0)
    expect(verticeA0).toHaveAttribute('aria-describedby', 'pentagono-dual-tooltip')
    expect(verticeA1).not.toHaveAttribute('aria-describedby')
    expect(verticeB0).not.toHaveAttribute('aria-describedby')

    const tooltipValor = screen.getByRole('tooltip').querySelector('div')
    expect(tooltipValor?.textContent).toBe('Poder de Fogo: 78')
  })

  it('exibe a legenda (figcaption) com os nomes exatos dos dois atletas e o espaçamento correto', () => {
    const { container } = render(
      <PentagonoDual percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />,
    )

    const figcaption = container.querySelector('figcaption')
    expect(figcaption?.textContent).toBe(
      'Comparação do Pentágono de Qualidade entre Atleta A (verde) e Atleta B (âmbar).',
    )
  })
})
