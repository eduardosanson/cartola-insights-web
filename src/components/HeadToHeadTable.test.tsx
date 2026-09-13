import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeadToHeadTable from './HeadToHeadTable'
import type { PercentisPadrao } from '../api/percentis'

/**
 * Fixture cobrindo, eixo a eixo, todas as combinações de "quem vence" e de
 * bruto ausente que o componente precisa distinguir:
 *
 * - Poder de Fogo: A (60) > B (40) → badge "Maior" só em A.
 * - Criação:       bruto de A ausente (indicador2/participacao_gol não
 *                   informados) → A mostra "—", B mostra o número, sem badge.
 * - Combate:        bruto de B ausente (indicador3/desarme não informados)
 *                   → B mostra "—", A mostra o número, sem badge.
 * - Piso Básico:    A (30) === B (30) → nenhum badge (empate não é vitória).
 * - Disciplina:     A (10) < B (20) → badge "Maior" só em B.
 */
const percentisA: PercentisPadrao = {
  atleta_id: 1,
  pontuacao_media: 70,
  participacao_gol: 50,
  desarme: 50,
  disciplina: 60,
  media_basica: 55,
  brutos: {
    pontuacao_media: 60,
    indicador3: 25,
    media_basica: 30,
    disciplina: 10,
  },
}

const percentisB: PercentisPadrao = {
  atleta_id: 2,
  pontuacao_media: 50,
  participacao_gol: 50,
  desarme: 50,
  disciplina: 40,
  media_basica: 45,
  brutos: {
    pontuacao_media: 40,
    indicador2: 45,
    media_basica: 30,
    disciplina: 20,
  },
}

function celulasDaLinha(rotulo: string): [HTMLElement, HTMLElement] {
  const linha = screen.getByText(rotulo).closest('tr')
  if (!linha) throw new Error(`linha "${rotulo}" não encontrada`)
  const [, celulaA, celulaB] = linha.querySelectorAll('td')
  return [celulaA, celulaB]
}

describe('HeadToHeadTable', () => {
  it('renderiza título, seção acessível e cabeçalhos com os nomes dos dois atletas', () => {
    render(<HeadToHeadTable percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    expect(screen.getByLabelText('Comparação Head-to-Head')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Head-to-Head' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Atleta A' })).toHaveClass('numeric')
    expect(screen.getByRole('columnheader', { name: 'Atleta B' })).toHaveClass('numeric')
  })

  it('marca com badge "Maior" só o atleta A quando o bruto de A é maior (Poder de Fogo)', () => {
    render(<HeadToHeadTable percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    const [celulaA, celulaB] = celulasDaLinha('Poder de Fogo')
    expect(celulaA.textContent).toBe('60Maior')
    expect(celulaB.textContent).toBe('40')
  })

  it('marca com badge "Maior" só o atleta B quando o bruto de B é maior (Disciplina)', () => {
    render(<HeadToHeadTable percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    const [celulaA, celulaB] = celulasDaLinha('Disciplina')
    expect(celulaA.textContent).toBe('10')
    expect(celulaB.textContent).toBe('20Maior')
  })

  it('não marca badge em nenhum lado quando os brutos empatam (Piso Básico)', () => {
    render(<HeadToHeadTable percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    const [celulaA, celulaB] = celulasDaLinha('Piso Básico')
    expect(celulaA.textContent).toBe('30')
    expect(celulaB.textContent).toBe('30')
  })

  it('mostra "—" e nenhum badge quando falta o bruto de A, mantendo o valor de B (Criação)', () => {
    render(<HeadToHeadTable percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    const [celulaA, celulaB] = celulasDaLinha('Criação')
    expect(celulaA.textContent).toBe('—')
    expect(celulaB.textContent).toBe('45')
  })

  it('mostra "—" e nenhum badge quando falta o bruto de B, mantendo o valor de A (Combate)', () => {
    render(<HeadToHeadTable percentisA={percentisA} percentisB={percentisB} nomeA="Atleta A" nomeB="Atleta B" />)

    const [celulaA, celulaB] = celulasDaLinha('Combate')
    expect(celulaA.textContent).toBe('25')
    expect(celulaB.textContent).toBe('—')
  })
})
