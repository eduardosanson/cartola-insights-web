import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renderiza "Provável" para status "provavel"', () => {
    const { container } = render(<StatusBadge statusNome="provavel" />)
    const badge = screen.getByText('Provável').closest('.status-badge') as HTMLElement
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('status-provavel')
    expect(badge.className).toBe('status-badge status-provavel')
    expect(badge).toHaveAttribute('title', 'Status no mercado: Provável')
    expect(container.querySelector('polyline[points="20 6 9 17 4 12"]')).toBeInTheDocument()
  })

  it('renderiza "Dúvida" para status "duvida"', () => {
    const { container } = render(<StatusBadge statusNome="duvida" />)
    const badge = screen.getByText('Dúvida').closest('.status-badge') as HTMLElement
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('status-duvida')
    expect(badge.className).toBe('status-badge status-duvida')
    expect(badge).toHaveAttribute('title', 'Status no mercado: Dúvida')
    expect(
      container.querySelector('path[d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"]'),
    ).toBeInTheDocument()
  })

  it('renderiza "Suspenso" para status "suspenso"', () => {
    const { container } = render(<StatusBadge statusNome="suspenso" />)
    const badge = screen.getByText('Suspenso').closest('.status-badge') as HTMLElement
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('status-suspenso')
    expect(badge.className).toBe('status-badge status-suspenso')
    expect(badge).toHaveAttribute('title', 'Status no mercado: Suspenso')
    expect(container.querySelector('circle[cx="12"][cy="12"][r="10"]')).toBeInTheDocument()
  })

  it('renderiza "Contundido" para status "contundido"', () => {
    const { container } = render(<StatusBadge statusNome="contundido" />)
    const badge = screen.getByText('Contundido').closest('.status-badge') as HTMLElement
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('status-contundido')
    expect(badge.className).toBe('status-badge status-contundido')
    expect(badge).toHaveAttribute('title', 'Status no mercado: Contundido')
    const svg = container.querySelector('svg')
    expect(svg?.querySelector('line[x1="12"][y1="5"][x2="12"][y2="19"]')).toBeInTheDocument()
    expect(svg?.querySelector('line[x1="5"][y1="12"][x2="19"][y2="12"]')).toBeInTheDocument()
    expect(svg?.children.length).toBe(2)
  })

  it('renderiza "Nulo" para status "nulo"', () => {
    const { container } = render(<StatusBadge statusNome="nulo" />)
    const badge = screen.getByText('Nulo').closest('.status-badge') as HTMLElement
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('status-nulo')
    expect(badge.className).toBe('status-badge status-nulo')
    expect(badge).toHaveAttribute('title', 'Status no mercado: Nulo')
    const svg = container.querySelector('svg')
    // Distingue de "contundido": nulo tem apenas a linha horizontal, sem a vertical.
    expect(svg?.querySelector('line[x1="5"][y1="12"][x2="19"][y2="12"]')).toBeInTheDocument()
    expect(svg?.querySelector('line[x1="12"][y1="5"][x2="12"][y2="19"]')).not.toBeInTheDocument()
    expect(svg?.children.length).toBe(1)
  })

  it('renderiza em modo ícone quando iconeApenas é true', () => {
    const { container } = render(<StatusBadge statusNome="provavel" iconeApenas />)
    const badge = screen.getByLabelText('Provável')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('status-badge-icon', 'status-provavel')
    expect(badge.className).toBe('status-badge status-badge-icon status-provavel')
    expect(badge).toHaveAttribute('title', 'Status: Provável')
    expect(screen.queryByText('Provável')).not.toBeInTheDocument()
    expect(container.querySelector('polyline[points="20 6 9 17 4 12"]')).toBeInTheDocument()
  })

  it('infere status_nome a partir de status_id caso status_nome seja omitido', () => {
    const { unmount: unmount7 } = render(<StatusBadge statusId={7} />)
    expect(screen.getByText('Provável')).toBeInTheDocument()
    unmount7()

    const { unmount: unmount2 } = render(<StatusBadge statusId={2} />)
    expect(screen.getByText('Dúvida')).toBeInTheDocument()
    unmount2()

    const { unmount: unmount3 } = render(<StatusBadge statusId={3} />)
    expect(screen.getByText('Suspenso')).toBeInTheDocument()
    unmount3()

    const { unmount: unmount5 } = render(<StatusBadge statusId={5} />)
    expect(screen.getByText('Contundido')).toBeInTheDocument()
    unmount5()

    render(<StatusBadge statusId={6} />)
    expect(screen.getByText('Nulo')).toBeInTheDocument()
  })

  it('não renderiza nada quando status_nome e status_id são nulos ou indefinidos', () => {
    const { container } = render(<StatusBadge statusNome={null} statusId={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
