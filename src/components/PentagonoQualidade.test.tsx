import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PentagonoQualidade from './PentagonoQualidade'
import type { PercentisPadrao, PercentisGol } from '../api/percentis'

const percentisLinha: PercentisPadrao = {
  atleta_id: 1,
  pontuacao_media: 94,
  participacao_gol: 78,
  desarme: 62,
  disciplina: 68,
  media_basica: 85,
  brutos: {
    pontuacao_media: 8.45,
    participacao_gol: 0.65,
    desarme: 1.8,
    disciplina: 0.85,
    media_basica: 5.2,
  },
  mediana_posicao: {
    pontuacao_media: 4.1,
    participacao_gol: 0.2,
    desarme: 1.1,
    disciplina: 0.5,
    media_basica: 2.8,
  },
  overall_score: 77.4,
}

const percentisGol: PercentisGol = {
  atleta_id: 2,
  pontuacao_media: 88,
  defesas: 80,
  solidez_sg: 70,
  disciplina: 90,
  media_basica: 60,
  brutos: {
    pontuacao_media: 6.2,
    defesas: 3.5,
    indicador2: 3.5,
    solidez_sg: 0.4,
    indicador3: 0.4,
    disciplina: 0.95,
    media_basica: 3.8,
  },
  mediana_posicao: {
    pontuacao_media: 3.9,
    defesas: 2.1,
    solidez_sg: 0.25,
    disciplina: 0.6,
    media_basica: 2.5,
  },
  overall_score: 77.6,
}

describe('PentagonoQualidade', () => {
  it('renderiza o SVG com 5 vértices e polígono do jogador para atleta de linha', () => {
    render(<PentagonoQualidade percentis={percentisLinha} raio={120} centroX={160} centroY={160} />)

    const svg = screen.getByRole('img', { name: /pentágono de qualidade/i })
    expect(svg).toBeInTheDocument()

    const vertices = screen.getAllByTestId(/^vertice-/)
    expect(vertices).toHaveLength(5)

    const poligonoJogador = screen.getByTestId('pentagono-jogador')
    expect(poligonoJogador).toBeInTheDocument()
    expect(poligonoJogador).toHaveAttribute('points')
  })

  it('dá margem horizontal suficiente no viewBox pro rótulo "Disciplina" (mais longo, ancorado à esquerda) não cortar', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    const svg = screen.getByRole('img', { name: /pentágono de qualidade/i })
    const [minX] = svg.getAttribute('viewBox')!.split(' ').map(Number)

    // Rótulo "Disciplina 100" tem ~13 caracteres, text-anchor="end" em x=58 —
    // precisa de min-x bem negativo pra não estourar a borda esquerda do SVG
    // (que corta o conteúdo por padrão) e cortar o começo da palavra.
    expect(minX).toBeLessThanOrEqual(-15)
  })

  it('renderiza os rótulos específicos para goleiro (GOL)', () => {
    render(<PentagonoQualidade percentis={percentisGol} />)

    expect(screen.getAllByText(/defesas/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/solidez \(sg\)/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/piso básico/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/disciplina/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renderiza 4 anéis concêntricos de referência (25, 50, 75, 100%)', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    expect(screen.getByTestId('anel-25')).toBeInTheDocument()
    expect(screen.getByTestId('anel-50')).toBeInTheDocument()
    expect(screen.getByTestId('anel-75')).toBeInTheDocument()
    expect(screen.getByTestId('anel-100')).toBeInTheDocument()
  })

  it('renderiza o polígono tracejado da mediana da posição (50%)', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    const mediana = screen.getByTestId('pentagono-mediana')
    expect(mediana).toBeInTheDocument()
    expect(mediana).toHaveClass('pentagon-avg-poly')
  })

  it('exibe o Overall Score central vindo do backend', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    const overall = screen.getByTestId('overall-score')
    expect(overall).toHaveTextContent('77,4')
  })

  it('calcula o Overall Score como média aritmética se não fornecido pelo backend', () => {
    const semOverall: PercentisPadrao = {
      ...percentisLinha,
      overall_score: undefined,
    }
    render(<PentagonoQualidade percentis={semOverall} />)

    const overall = screen.getByTestId('overall-score')
    expect(overall).toHaveTextContent('77,4')
  })

  it('renderiza o Overall Score centralizado dentro do SVG do pentágono (CA03), não como badge solto no canto', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    const svg = screen.getByRole('img', { name: /pentágono de qualidade/i })
    const overall = screen.getByTestId('overall-score')

    expect(svg.contains(overall)).toBe(true)
  })

  it('não exibe a palavra "Overall" — só o número', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    const overall = screen.getByTestId('overall-score')
    expect(overall).not.toHaveTextContent(/overall/i)
    expect(overall).toHaveTextContent('77,4')
  })

  it('rótulos dos eixos mostram o número sem o sinal de %', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    expect(screen.getByText('Poder de Fogo 94')).toBeInTheDocument()
    expect(screen.queryByText(/94%/)).not.toBeInTheDocument()
  })

  it('exibe e esconde tooltip no mouseEnter / mouseLeave', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    const vertice0 = screen.getByTestId('vertice-0')
    fireEvent.mouseEnter(vertice0)

    let tooltip = screen.queryByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent(/poder de fogo/i)
    expect(tooltip).toHaveTextContent('94º percentil')
    expect(tooltip).toHaveTextContent('8,45')

    fireEvent.mouseLeave(vertice0)
    tooltip = screen.queryByRole('tooltip')
    expect(tooltip).not.toBeInTheDocument()
  })

  it('exibe e esconde tooltip no focus / blur por teclado', () => {
    render(<PentagonoQualidade percentis={percentisLinha} />)

    const vertice1 = screen.getByTestId('vertice-1')
    fireEvent.focus(vertice1)

    let tooltip = screen.queryByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent('Criação')

    fireEvent.blur(vertice1)
    tooltip = screen.queryByRole('tooltip')
    expect(tooltip).not.toBeInTheDocument()
  })

  it('funciona corretamente sem objeto de brutos', () => {
    const semBrutos: PercentisPadrao = {
      atleta_id: 3,
      pontuacao_media: 50,
      participacao_gol: 50,
      desarme: 50,
      disciplina: 50,
      media_basica: 50,
    }
    render(<PentagonoQualidade percentis={semBrutos} />)

    const vertice0 = screen.getByTestId('vertice-0')
    fireEvent.mouseEnter(vertice0)

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent('50º percentil')
    expect(tooltip).not.toHaveTextContent('Média:')
  })

  it('funciona corretamente para GOL sem objeto de brutos', () => {
    const golSemBrutos: PercentisGol = {
      atleta_id: 4,
      pontuacao_media: 60,
      defesas: 70,
      solidez_sg: 80,
      disciplina: 90,
      media_basica: 50,
    }
    render(<PentagonoQualidade percentis={golSemBrutos} />)

    const vertice1 = screen.getByTestId('vertice-1')
    fireEvent.mouseEnter(vertice1)

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent('Defesas')
    expect(tooltip).toHaveTextContent('70º percentil')
  })

  it('suporta brutos com chaves indicador2 e indicador3 da API do backend', () => {
    const comIndicadores: PercentisPadrao = {
      atleta_id: 5,
      pontuacao_media: 80,
      participacao_gol: 89,
      desarme: 35,
      disciplina: 62,
      media_basica: 79,
      overall_score: 69.3,
      brutos: {
        pontuacao_media: 5.06,
        indicador2: 0.38,
        indicador3: 0.38,
        disciplina: 0.69,
        media_basica: 2.63,
      },
    }
    render(<PentagonoQualidade percentis={comIndicadores} />)

    const vertice1 = screen.getByTestId('vertice-1')
    fireEvent.mouseEnter(vertice1)

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent('Criação')
    expect(tooltip).toHaveTextContent('89º percentil')
    expect(tooltip).toHaveTextContent('0,38')
  })
})
