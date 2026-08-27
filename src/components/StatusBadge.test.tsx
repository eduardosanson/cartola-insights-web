import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renderiza "Provável" para status "provavel"', () => {
    render(<StatusBadge statusNome="provavel" />)
    const badge = screen.getByText('Provável')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('.status-badge')).toHaveClass('status-provavel')
  })

  it('renderiza "Dúvida" para status "duvida"', () => {
    render(<StatusBadge statusNome="duvida" />)
    const badge = screen.getByText('Dúvida')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('.status-badge')).toHaveClass('status-duvida')
  })

  it('renderiza "Suspenso" para status "suspenso"', () => {
    render(<StatusBadge statusNome="suspenso" />)
    const badge = screen.getByText('Suspenso')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('.status-badge')).toHaveClass('status-suspenso')
  })

  it('renderiza "Contundido" para status "contundido"', () => {
    render(<StatusBadge statusNome="contundido" />)
    const badge = screen.getByText('Contundido')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('.status-badge')).toHaveClass('status-contundido')
  })

  it('renderiza "Nulo" para status "nulo"', () => {
    render(<StatusBadge statusNome="nulo" />)
    const badge = screen.getByText('Nulo')
    expect(badge).toBeInTheDocument()
    expect(badge.closest('.status-badge')).toHaveClass('status-nulo')
  })

  it('renderiza em modo ícone quando iconeApenas é true', () => {
    render(<StatusBadge statusNome="provavel" iconeApenas />)
    const badge = screen.getByLabelText('Provável')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('status-badge-icon', 'status-provavel')
    expect(screen.queryByText('Provável')).not.toBeInTheDocument()
  })

  it('infere status_nome a partir de status_id caso status_nome seja omitido', () => {
    render(<StatusBadge statusId={7} />)
    expect(screen.getByText('Provável')).toBeInTheDocument()

    render(<StatusBadge statusId={2} />)
    expect(screen.getByText('Dúvida')).toBeInTheDocument()
  })

  it('não renderiza nada quando status_nome e status_id são nulos ou indefinidos', () => {
    const { container } = render(<StatusBadge statusNome={null} statusId={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
