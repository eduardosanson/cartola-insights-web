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

  it('renderiza o botão gatilho fechado por padrão, sem classe "ativo" e sem contador', () => {
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
    expect(botao.className).toBe('dropdown-filtro-gatilho')
    expect(botao.querySelector('.dropdown-filtro-count')).toBeNull()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('define aria-label padrão combinando label e total de selecionados quando ariaLabel não é fornecido', () => {
    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={[]}
        onToggle={vi.fn()}
      />,
    )

    const botao = screen.getByRole('button', { name: /Status/i })
    expect(botao).toHaveAttribute('aria-label', 'Status: 0 selecionados')
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
    expect(screen.getByRole('listbox')).toHaveAttribute('tabindex', '-1')
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

  it('chama onToggle e previne o comportamento padrão ao pressionar Enter ou Espaço em uma opção, mas ignora outras teclas', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={[]}
        onToggle={onToggle}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Status/i }))
    const opcaoDuvida = screen.getByText('Dúvida').closest('[role="option"]') as HTMLElement

    const resultEnter = fireEvent.keyDown(opcaoDuvida, { key: 'Enter' })
    expect(onToggle).toHaveBeenCalledWith('duvida')
    expect(resultEnter).toBe(false)

    onToggle.mockClear()
    const resultSpace = fireEvent.keyDown(opcaoDuvida, { key: ' ' })
    expect(onToggle).toHaveBeenCalledWith('duvida')
    expect(resultSpace).toBe(false)

    onToggle.mockClear()
    fireEvent.keyDown(opcaoDuvida, { key: 'a' })
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('marca a opção selecionada com a classe e o checkbox correspondentes, mantendo o checkbox fora da ordem de tabulação', async () => {
    const user = userEvent.setup()

    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={['duvida']}
        onToggle={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Status/i }))

    const opcaoDuvida = screen.getByText('Dúvida').closest('[role="option"]') as HTMLElement
    expect(opcaoDuvida.className).toBe('dropdown-filtro-opcao selecionada')
    const checkboxDuvida = opcaoDuvida.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkboxDuvida).toHaveAttribute('tabindex', '-1')
    expect(checkboxDuvida).toBeChecked()

    const opcaoSuspenso = screen.getByText('Suspenso').closest('[role="option"]') as HTMLElement
    expect(opcaoSuspenso.className).toBe('dropdown-filtro-opcao')
  })

  it('exibe o badge da opção quando fornecido, e omite quando ausente', async () => {
    const user = userEvent.setup()
    const opcoesComBadge = [
      { valor: 'provavel', label: 'Provável', badge: <span data-testid="badge-provavel">P</span> },
      { valor: 'duvida', label: 'Dúvida' },
    ]

    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoesComBadge}
        selecionados={[]}
        onToggle={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Status/i }))

    const opcaoProvavel = screen.getByText('Provável').closest('[role="option"]') as HTMLElement
    expect(opcaoProvavel.querySelector('.dropdown-filtro-badge')).not.toBeNull()
    expect(screen.getByTestId('badge-provavel')).toBeInTheDocument()

    const opcaoDuvida = screen.getByText('Dúvida').closest('[role="option"]') as HTMLElement
    expect(opcaoDuvida.querySelector('.dropdown-filtro-badge')).toBeNull()
  })

  it('exibe a contagem de itens selecionados e a classe "ativo" no botão gatilho', () => {
    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={['provavel', 'duvida']}
        onToggle={vi.fn()}
      />,
    )

    const botao = screen.getByRole('button', { name: /Status/i })
    expect(botao.className).toBe('dropdown-filtro-gatilho ativo')
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('aplica a classe do chevron indicando se o menu está aberto ou fechado', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={[]}
        onToggle={vi.fn()}
      />,
    )

    const chevron = container.querySelector('svg') as SVGElement
    expect(chevron).toHaveClass('dropdown-filtro-chevron', { exact: true })

    await user.click(screen.getByRole('button', { name: /Status/i }))
    expect(chevron).toHaveClass('dropdown-filtro-chevron', 'aberto')
    expect(chevron.classList).toHaveLength(2)
  })

  it('fecha o menu ao pressionar Escape ou clicar fora, e ignora outras teclas', async () => {
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

    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.click(botao)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId('fora'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('remove os listeners de mousedown e keydown ao fechar o menu', async () => {
    const user = userEvent.setup()
    const removeDocSpy = vi.spyOn(document, 'removeEventListener')
    const removeWinSpy = vi.spyOn(window, 'removeEventListener')

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
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    expect(removeDocSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(removeWinSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    removeDocSpy.mockRestore()
    removeWinSpy.mockRestore()
  })

  it('não exibe o botão de limpar quando não há itens selecionados, mesmo com onLimpar fornecido', async () => {
    const user = userEvent.setup()

    render(
      <DropdownFiltro
        label="Status"
        opcoes={opcoes}
        selecionados={[]}
        onToggle={vi.fn()}
        onLimpar={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Status/i }))
    expect(screen.queryByRole('button', { name: /Limpar/i })).not.toBeInTheDocument()
  })

  it('permite limpar seleção se onLimpar for fornecido, e fecha o menu ao limpar', async () => {
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
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
