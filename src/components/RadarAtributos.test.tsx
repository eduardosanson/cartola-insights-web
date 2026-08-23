import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RadarAtributos from './RadarAtributos'
import type { PercentisPadrao, PercentisGol } from '../api/percentis'

const percentisPadrao: PercentisPadrao = {
  atleta_id: 1,
  pontuacao_media: 80,
  participacao_gol: 91,
  desarme: 40,
  disciplina: 65,
}
const percentisGol: PercentisGol = {
  atleta_id: 2,
  pontuacao_media: 70,
  defesas: 88,
  solidez_sg: 95,
  disciplina: 50,
}

describe('RadarAtributos', () => {
  it('mostra os 4 rotulos certos pra ZAG/LAT/MEI/ATA', () => {
    render(<RadarAtributos percentis={percentisPadrao} />)
    expect(screen.getByText('Pontuação média')).toBeInTheDocument()
    expect(screen.getByText('Participação em gol')).toBeInTheDocument()
    expect(screen.getByText('Desarme')).toBeInTheDocument()
    expect(screen.getByText('Disciplina')).toBeInTheDocument()
  })

  it('mostra os rotulos certos pra GOL (Defesas/Solidez), nao Participacao/Desarme', () => {
    render(<RadarAtributos percentis={percentisGol} />)
    expect(screen.getByText('Defesas')).toBeInTheDocument()
    expect(screen.getByText('Solidez (SG)')).toBeInTheDocument()
    expect(screen.queryByText('Participação em gol')).not.toBeInTheDocument()
  })

  it('com todos os percentis em 100, o poligono toca o raio maximo nos 4 eixos', () => {
    const todosCem: PercentisPadrao = {
      atleta_id: 3,
      pontuacao_media: 100,
      participacao_gol: 100,
      desarme: 100,
      disciplina: 100,
    }
    render(<RadarAtributos percentis={todosCem} raio={100} centroX={150} centroY={150} />)
    const poligono = screen.getByTestId('radar-poligono')
    const pontos = poligono.getAttribute('points')!.trim().split(/\s+/)
    // eixo 0 (topo): (150, 150-100) = (150,50)
    expect(pontos[0]).toBe('150,50')
    // eixo 1 (direita): (150+100, 150) = (250,150)
    expect(pontos[1]).toBe('250,150')
    // eixo 2 (baixo): (150, 150+100) = (150,250)
    expect(pontos[2]).toBe('150,250')
    // eixo 3 (esquerda): (150-100, 150) = (50,150)
    expect(pontos[3]).toBe('50,150')
  })
})