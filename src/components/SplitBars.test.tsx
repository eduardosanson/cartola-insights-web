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

  describe('ARIA (issue #7, RF03)', () => {
    it('agrupa as barras com rótulo acessível', () => {
      render(<SplitBars mediaCasa={10} mediaFora={5} />)
      expect(screen.getByRole('group', { name: 'Média em casa e fora' })).toBeInTheDocument()
    })

    it('expõe cada barra como meter com valor, limites e rótulo', () => {
      render(<SplitBars mediaCasa={10} mediaFora={5} />)
      const casa = screen.getByRole('meter', { name: 'Média em casa' })
      const fora = screen.getByRole('meter', { name: 'Média fora' })
      expect(casa).toHaveAttribute('aria-valuenow', '10')
      expect(casa).toHaveAttribute('aria-valuemin', '0')
      expect(casa).toHaveAttribute('aria-valuemax', '10')
      expect(fora).toHaveAttribute('aria-valuenow', '5')
      expect(fora).toHaveAttribute('aria-valuemax', '10')
    })
  })
})
