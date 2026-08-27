import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import DropdownFiltro from './DropdownFiltro'

describe('DropdownFiltro', () => {
  const opcoes = [
    { valor: 'provavel', label: 'Provável' },
    { valor: 'duvida', label: 'Dúvida' },
    { valor: 'suspenso', label: 'Suspenso' },
  ]

  it('renderiza o botão gatilho fechado por padrão', () => {
    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={[]}
        onToggle={vi.fn()}
      />,
    )

    const botao = screen.getByRole('button', { name: /Status/i })
    expect(botao).toBeInTheDocument()
    expect(botao).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('abre o menu ao clicar no botão gatilho e exibe as opções', async () => {
    const user = userEvent.setup()
    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={[]}
        onToggle={vi.fn()}
      />,
    )

    const botao = screen.getByRole('button', { name: /Status/i })
    await user.click(botao)

    expect(botao).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Provável')).toBeInTheDocument()
    expect(screen.getByText('Dúvida')).toBeInTheDocument()
    expect(screen.getByText('Suspenso')).toBeInTheDocument()
  })

  it('chama onToggle ao clicar em uma opção do dropdown', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={['provavel']}
        onToggle={onToggle}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Status/i }))
    await user.click(screen.getByText('Dúvida'))

    expect(onToggle).toHaveBeenCalledWith('duvida')
  })

  it('exibe a contagem de itens selecionados no botão gatilho', () => {
    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={['provavel', 'duvida']}
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('fecha o menu ao pressionar Escape ou clicar fora', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <div data-testid="fora">Fora</div>
        <DropdownFiltro
          label="Status"
          opcoes={opcoes}
          selecionados={[]}
          onToggle={vi.fn()}
        />
      </div>,
    )

    const botao = screen.getByRole('button', { name: /Status/i })
    await user.click(botao)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.click(botao)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId('fora'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('permite limpar seleção se onLimpar for fornecido', async () => {
    const user = userEvent.setup()
    const onLimpar = vi.fn()

    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={['provavel', 'duvida']}
        onToggle={vi.fn()}
        onLimpar={onLimpar}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Status/i }))
    const btnLimpar = screen.getByRole('button', { name: /Limpar/i })
    await user.click(btnLimpar)

    expect(onLimpar).toHaveBeenCalledTimes(1)
  })
})
