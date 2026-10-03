import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EscalacaoOtima } from '../api/otimizador'
import IndicadoresTime from './IndicadoresTime'

const escalacao: EscalacaoOtima = {
  titulares: [
    { atleta_id: 1, posicao: 'GOL', preco: 6, pontuacao_esperada: 4 },
    { atleta_id: 2, posicao: 'ATA', preco: 10, pontuacao_esperada: 8 },
  ],
  tecnico: { atleta_id: 3, preco: 5 },
  custo_total: 21,
  pontuacao_esperada_total: 12,
  esquema: '4-3-3',
  modo: 'classica',
}

describe('IndicadoresTime', () => {
  it('resume mandos, confrontos, média no mando e preço médio', () => {
    render(
      <IndicadoresTime
        escalacao={escalacao}
        detalhes={{
          1: { nome: 'A', mando: 'casa', mediaNoMando: 4 },
          2: { nome: 'B', mando: 'fora', mediaNoMando: 6 },
        }}
      />,
    )
    expect(screen.getByText('Jogando em casa').nextSibling).toHaveTextContent('1/2')
    expect(screen.getByText('Confrontos conhecidos').nextSibling).toHaveTextContent('2/2')
    expect(screen.getByText('Média no mando').nextSibling).toHaveTextContent('5')
    expect(screen.getByText('Preço médio por titular').nextSibling).toHaveTextContent('8,00')
  })

  it('mostra travessão quando não há média no mando', () => {
    render(<IndicadoresTime escalacao={escalacao} detalhes={{}} />)
    expect(screen.getByText('Média no mando').nextSibling).toHaveTextContent('—')
    expect(screen.getByText('Jogando em casa').nextSibling).toHaveTextContent('0/2')
  })
})
