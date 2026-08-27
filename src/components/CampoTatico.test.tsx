import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { EscalacaoOtima, ModoOtimizacao } from '../api/otimizador'
import CampoTatico, { type DetalhesAtletaCampo } from './CampoTatico'

function criarEscalacao(modo: ModoOtimizacao): EscalacaoOtima {
  return {
    titulares: [
      { atleta_id: 1, posicao: 'GOL', preco: 8, pontuacao_esperada: 4.5 },
      { atleta_id: 2, posicao: 'ZAG', preco: 7, pontuacao_esperada: 5.5 },
      { atleta_id: 3, posicao: 'LAT', preco: 9, pontuacao_esperada: 6.5 },
      { atleta_id: 7, posicao: 'ZAG', preco: 8, pontuacao_esperada: 5 },
      { atleta_id: 8, posicao: 'LAT', preco: 8, pontuacao_esperada: 6 },
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

const detalhes: Record<number, DetalhesAtletaCampo> = {
  1: { nome: 'Goleiro', clubeNome: 'Clube 1', adversarioNome: 'Clube 2', mando: 'casa', mediaNoMando: 7 },
  2: { nome: 'Zagueiro esquerdo', clubeNome: 'Santos', adversarioNome: 'Palmeiras', mando: 'fora', mediaNoMando: 5 },
  3: { nome: 'Lateral esquerdo', clubeNome: 'Clube 2', adversarioNome: 'Clube 4', mando: 'casa' },
  4: { nome: 'Meia', clubeNome: 'Clube 3', adversarioNome: 'Clube 5', mando: 'fora' },
  5: { nome: 'Atacante', clubeNome: 'Flamengo', adversarioNome: 'Vasco da Gama', mando: 'casa', mediaNoMando: 8.25 },
  6: { nome: 'Técnico', clubeNome: 'Clube 1' },
  7: { nome: 'Zagueiro direito', clubeNome: 'Clube 5', adversarioNome: 'Clube 1', mando: 'fora' },
  8: { nome: 'Lateral direito', clubeNome: 'Clube 6', adversarioNome: 'Clube 2', mando: 'casa' },
}

describe('CampoTatico', () => {
  it('organiza atletas por linhas e cria links para os detalhes', () => {
    render(
      <MemoryRouter>
        <CampoTatico escalacao={criarEscalacao('classica')} detalhes={detalhes} />
      </MemoryRouter>,
    )

    expect(within(screen.getByLabelText('Ataque')).getByText('Atacante')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Meio')).getByText('Meia')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Defesa')).getByText('Zagueiro esquerdo')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Defesa')).getByText('Lateral esquerdo')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Gol')).getByText('Goleiro')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /atacante/i })).toHaveAttribute('href', '/jogadores/5')
    const atacante = screen.getByRole('link', { name: /atacante/i })
    expect(within(atacante).getByText('FLA')).toHaveClass('campo-atleta-clube')
    expect(within(atacante).getByText('ATA · C$ 11,00')).toBeInTheDocument()
    expect(atacante.querySelector('.campo-atleta-confronto')).toHaveTextContent(
      'FLA x VAS',
    )
    expect(within(atacante).getByText('Média casa: 8,25')).toBeInTheDocument()
    const zagueiro = screen.getByRole('link', { name: /zagueiro esquerdo/i })
    expect(zagueiro.querySelector('.campo-atleta-confronto')).toHaveTextContent(
      'PAL x SAN',
    )
    expect(within(zagueiro).getByText('Média fora: 5')).toBeInTheDocument()
  })

  it('posiciona os laterais nas pontas da linha de defesa', () => {
    render(
      <MemoryRouter>
        <CampoTatico escalacao={criarEscalacao('classica')} detalhes={detalhes} />
      </MemoryRouter>,
    )

    const defensores = within(screen.getByLabelText('Defesa')).getAllByRole('link')
    expect(defensores.map((defensor) => defensor.textContent)).toEqual([
      expect.stringContaining('Lateral esquerdo'),
      expect.stringContaining('Zagueiro esquerdo'),
      expect.stringContaining('Zagueiro direito'),
      expect.stringContaining('Lateral direito'),
    ])
  })

  it('mantém cartões úteis quando os detalhes complementares não estão disponíveis', () => {
    render(
      <MemoryRouter>
        <CampoTatico escalacao={criarEscalacao('classica')} detalhes={{}} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Atleta #5')).toBeInTheDocument()
    expect(screen.getByText('Técnico #6')).toBeInTheDocument()
    expect(screen.getByText('Time não disponível')).toBeInTheDocument()
    expect(screen.getAllByText('Confronto não disponível')).toHaveLength(7)
  })

  it.each(['classica', 'tiro_curto', 'patrimonio', 'overall'] as const)(
    'mantém os mesmos valores visíveis no modo %s',
    (modo) => {
    render(
      <MemoryRouter>
        <CampoTatico escalacao={criarEscalacao(modo)} detalhes={detalhes} />
      </MemoryRouter>,
    )

      expect(screen.getByText('Média casa: 8,25')).toBeInTheDocument()
      expect(screen.queryByText(/Média básica:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Teto estimado:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Margem sobre MPV:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Score multifator:/i)).not.toBeInTheDocument()
    },
  )
})
