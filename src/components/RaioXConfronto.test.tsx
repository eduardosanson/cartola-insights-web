import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RaioXConfronto from './RaioXConfronto'
import type { RaioXConfronto as RaioXConfrontoTipo } from '../api/raioX'

const base: RaioXConfrontoTipo = {
  atleta_id: 1,
  posicao: 'ATA',
  rodada: 24,
  mando: 'casa',
  clube_adversario_id: 267,
  clube_adversario_nome: 'Vasco',
  media_no_mando: 7.15,
  pontos_cedidos_adversario: 4.89,
  participacao_pontuacao_time_media: 12.4,
  veredito: 'referencia_do_time',
}

describe('RaioXConfronto', () => {
  it('mostra os tres blocos e o selo de veredito quando tudo vem preenchido', () => {
    render(<RaioXConfronto raioX={base} />)

    expect(screen.getByText('Média em casa')).toBeInTheDocument()
    expect(screen.getByText('7,15')).toBeInTheDocument()
    expect(screen.getByText(/Vasco/)).toBeInTheDocument()
    expect(screen.getByText('4,89')).toBeInTheDocument()
    expect(screen.getByText('12,4%')).toBeInTheDocument()
    expect(screen.getByText('Referência do time')).toBeInTheDocument()
  })

  it('usa o rotulo "Media fora" quando mando e fora', () => {
    render(<RaioXConfronto raioX={{ ...base, mando: 'fora' }} />)

    expect(screen.getByText('Média fora')).toBeInTheDocument()
    expect(screen.queryByText('Média em casa')).not.toBeInTheDocument()
  })

  it('mostra texto de indisponibilidade so no bloco sem dado, sem esconder os outros', () => {
    render(<RaioXConfronto raioX={{ ...base, pontos_cedidos_adversario: null }} />)

    expect(screen.getByText(/sem dado suficiente/i)).toBeInTheDocument()
    expect(screen.getByText('7,15')).toBeInTheDocument() // bloco 1 continua
    expect(screen.getByText('Referência do time')).toBeInTheDocument() // selo continua
  })

  it('nao escolhe um rotulo de veredito quando veredito e null', () => {
    const { container } = render(
      <RaioXConfronto
        raioX={{ ...base, participacao_pontuacao_time_media: null, veredito: null }}
      />,
    )

    expect(screen.queryByText('Referência do time')).not.toBeInTheDocument()
    expect(screen.queryByText('Contribuição dividida')).not.toBeInTheDocument()
    expect(screen.queryByText('Pontuação diluída')).not.toBeInTheDocument()
    expect(screen.getByText(/sem veredito/i)).toBeInTheDocument()
    // veredito null não deve nem renderizar o <span> do selo (mata mutante que troca `!== null` por `true`)
    expect(container.querySelector('.verdict-badge')).not.toBeInTheDocument()
  })

  it('mostra "sem dado suficiente" na participação quando ela e null, mesmo com veredito preenchido', () => {
    render(
      <RaioXConfronto raioX={{ ...base, participacao_pontuacao_time_media: null }} />,
    )

    // veredito continua preenchido, então o único "sem dado suficiente" na tela é o da participação
    expect(screen.getByText('sem dado suficiente')).toBeInTheDocument()
    expect(screen.getByText('Referência do time')).toBeInTheDocument()
    expect(screen.queryByText('12,4%')).not.toBeInTheDocument()
  })

  it('aplica a cor de destaque correta nos valores de média em casa e média cedida pelo adversário', () => {
    render(<RaioXConfronto raioX={base} />)

    expect(screen.getByText('7,15')).toHaveStyle({ color: 'var(--accent-home)' })
    expect(screen.getByText('4,89')).toHaveStyle({ color: 'var(--accent-away)' })
  })

  it('usa um tom diferente de badge por veredito: positivo, neutro e negativo', () => {
    const { rerender } = render(
      <RaioXConfronto raioX={{ ...base, veredito: 'referencia_do_time' }} />,
    )
    expect(screen.getByText('Referência do time')).toHaveClass('tone-positivo')

    rerender(<RaioXConfronto raioX={{ ...base, veredito: 'contribuicao_dividida' }} />)
    expect(screen.getByText('Contribuição dividida')).toHaveClass('tone-neutro')

    rerender(<RaioXConfronto raioX={{ ...base, veredito: 'pontuacao_diluida' }} />)
    expect(screen.getByText('Pontuação diluída')).toHaveClass('tone-negativo')
  })
})
