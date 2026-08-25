import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
