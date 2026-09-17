import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SplitBars from './SplitBars'

describe('SplitBars', () => {
  it('mostra as médias casa e fora com os rótulos e valores formatados', () => {
    render(<SplitBars mediaCasa={7.156} mediaFora={5.345} />)

    expect(screen.getByText('Média em casa')).toBeInTheDocument()
    expect(screen.getByText('7,16')).toBeInTheDocument()
    expect(screen.getByText('Média fora')).toBeInTheDocument()
    expect(screen.getByText('5,35')).toBeInTheDocument()
  })

  it('aplica a cor de destaque correta em cada valor (casa e fora)', () => {
    render(<SplitBars mediaCasa={7.156} mediaFora={5.345} />)

    const valores = document.querySelectorAll('.v')
    expect(valores[0]).toHaveStyle({ color: 'var(--accent-home)' })
    expect(valores[1]).toHaveStyle({ color: 'var(--accent-away)' })
  })

  it('escala as barras em relação ao maior dos dois valores', () => {
    render(<SplitBars mediaCasa={10} mediaFora={5} />)

    const barras = document.querySelectorAll('.bar-fill')
    expect(barras[0]).toHaveStyle({ width: '100%' })
    expect(barras[1]).toHaveStyle({ width: '50%' })
  })

  it('nao quebra quando os dois valores sao zero', () => {
    render(<SplitBars mediaCasa={0} mediaFora={0} />)

    const barras = document.querySelectorAll('.bar-fill')
    expect(barras[0]).toHaveStyle({ width: '0%' })
    expect(barras[1]).toHaveStyle({ width: '0%' })
  })
})
