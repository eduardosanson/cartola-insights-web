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
    render(
      <RaioXConfronto
        raioX={{ ...base, participacao_pontuacao_time_media: null, veredito: null }}
      />,
    )

    expect(screen.queryByText('Referência do time')).not.toBeInTheDocument()
    expect(screen.queryByText('Contribuição dividida')).not.toBeInTheDocument()
    expect(screen.queryByText('Pontuação diluída')).not.toBeInTheDocument()
    expect(screen.getByText(/sem veredito/i)).toBeInTheDocument()
  })
})
