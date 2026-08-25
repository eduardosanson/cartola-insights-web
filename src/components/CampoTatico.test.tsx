import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { EscalacaoOtima, ModoOtimizacao } from '../api/otimizador'
import CampoTatico from './CampoTatico'

function criarEscalacao(modo: ModoOtimizacao): EscalacaoOtima {
  return {
    titulares: [
      { atleta_id: 1, posicao: 'GOL', preco: 8, pontuacao_esperada: 4.5 },
      { atleta_id: 2, posicao: 'ZAG', preco: 7, pontuacao_esperada: 5.5 },
      { atleta_id: 3, posicao: 'LAT', preco: 9, pontuacao_esperada: 6.5 },
      { atleta_id: 4, posicao: 'MEI', preco: 10, pontuacao_esperada: 7.5 },
      { atleta_id: 5, posicao: 'ATA', preco: 11, pontuacao_esperada: 8.5 },
    ],
    tecnico: { atleta_id: 6, preco: 4 },
    custo_total: 49,
    pontuacao_esperada_total: 32.5,
    esquema: '4-3-3',
    modo,
  }
}

const nomes = { 1: 'Goleiro', 2: 'Zagueiro', 3: 'Lateral', 4: 'Meia', 5: 'Atacante', 6: 'Técnico' }

describe('CampoTatico', () => {
  it('organiza atletas por linhas e cria links para os detalhes', () => {
    render(
      <MemoryRouter>
        <CampoTatico escalacao={criarEscalacao('classica')} nomes={nomes} />
      </MemoryRouter>,
    )

    expect(within(screen.getByLabelText('Ataque')).getByText('Atacante')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Meio')).getByText('Meia')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Defesa')).getByText('Zagueiro')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Defesa')).getByText('Lateral')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Gol')).getByText('Goleiro')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /atacante/i })).toHaveAttribute('href', '/jogadores/5')
  })

  it.each([
    ['classica', 'Média básica'],
    ['tiro_curto', 'Teto estimado'],
    ['patrimonio', 'Margem sobre MPV'],
  ] as const)('usa o rótulo de objetivo correto no modo %s', (modo, rotulo) => {
    render(
      <MemoryRouter>
        <CampoTatico escalacao={criarEscalacao(modo)} nomes={nomes} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText(new RegExp(rotulo, 'i'))).toHaveLength(5)
  })
})
