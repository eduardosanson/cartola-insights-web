import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MandoRodada from './MandoRodada'

describe('MandoRodada', () => {
  it('renderiza "Casa" com a cor de mando de casa quando showRound é omitido', () => {
    render(<MandoRodada mando="casa" rodada={10} />)
    const el = screen.getByText('Casa')
    expect(el).toBeInTheDocument()
    expect(el).toHaveStyle({ color: 'var(--accent-home)' })
  })

  it('renderiza "Fora" com a cor de mando de fora quando showRound é omitido', () => {
    render(<MandoRodada mando="fora" rodada={10} />)
    const el = screen.getByText('Fora')
    expect(el).toHaveStyle({ color: 'var(--accent-away)' })
  })

  it('renderiza "Sem jogo" com a cor de texto muted quando showRound é omitido', () => {
    render(<MandoRodada mando="sem_jogo" rodada={10} />)
    const el = screen.getByText('Sem jogo')
    expect(el).toBeInTheDocument()
    expect(el).toHaveStyle({ color: 'var(--text-muted)' })
  })

  it('não incorpora a rodada ao label quando showRound é false explicitamente', () => {
    render(<MandoRodada mando="casa" rodada={10} showRound={false} />)
    expect(screen.getByText('Casa')).toBeInTheDocument()
    expect(screen.queryByText(/Rodada/)).not.toBeInTheDocument()
  })

  it('mostra "Sem rodada sincronizada" quando showRound é true e rodada é null', () => {
    render(<MandoRodada mando="casa" rodada={null} showRound />)
    expect(screen.getByText('Sem rodada sincronizada')).toBeInTheDocument()
    expect(screen.queryByText('Casa')).not.toBeInTheDocument()
  })

  it('mostra "Sem jogo na rodada N" quando showRound é true, mando é sem_jogo e rodada não é null', () => {
    render(<MandoRodada mando="sem_jogo" rodada={5} showRound />)
    expect(screen.getByText('Sem jogo na rodada 5')).toBeInTheDocument()
  })

  it('mostra "Rodada N · Casa" quando showRound é true, mando é casa e rodada não é null', () => {
    render(<MandoRodada mando="casa" rodada={10} showRound />)
    expect(screen.getByText('Rodada 10 · Casa')).toBeInTheDocument()
  })

  it('mostra "Rodada N · Fora" quando showRound é true, mando é fora e rodada não é null', () => {
    render(<MandoRodada mando="fora" rodada={7} showRound />)
    expect(screen.getByText('Rodada 7 · Fora')).toBeInTheDocument()
  })

  it('trata rodada 0 como valor válido (diferente de null) quando showRound é true', () => {
    render(<MandoRodada mando="casa" rodada={0} showRound />)
    expect(screen.getByText('Rodada 0 · Casa')).toBeInTheDocument()
    expect(screen.queryByText('Sem rodada sincronizada')).not.toBeInTheDocument()
  })
})
