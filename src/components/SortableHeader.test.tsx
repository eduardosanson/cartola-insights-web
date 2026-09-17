import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SortableHeader from './SortableHeader'

describe('SortableHeader', () => {
  it('renders as a <th> with class "numeric" and no columnheader role by default', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <SortableHeader label="Preço" onToggle={vi.fn()} />
          </tr>
        </thead>
      </table>,
    )

    const th = container.querySelector('th')
    expect(th).not.toBeNull()
    expect(th).toHaveClass('numeric')
    expect(th?.className).toBe('numeric')
    expect(th?.getAttribute('role')).toBeNull()
  })

  it('renders as a <div> with role="columnheader" and class "numeric" when as="div"', () => {
    const { container } = render(<SortableHeader label="Preço" onToggle={vi.fn()} as="div" />)

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
    expect(wrapper).toHaveClass('numeric')
    expect(wrapper.className).toBe('numeric')
    expect(wrapper).toHaveAttribute('role', 'columnheader')
  })

  it('shows "decrescente" in the aria-label when the active criterion direction is desc', () => {
    render(
      <SortableHeader
        label="Preço"
        criterion={{ key: 'preco', direction: 'desc' }}
        priority={1}
        onToggle={vi.fn()}
      />,
    )

    const button = screen.getByRole('button', { name: 'Preço: decrescente, prioridade 1' })
    expect(button).toHaveAttribute('aria-label', 'Preço: decrescente, prioridade 1')
  })

  it('shows "crescente" in the aria-label when the active criterion direction is asc', () => {
    render(
      <SortableHeader
        label="Preço"
        criterion={{ key: 'preco', direction: 'asc' }}
        priority={2}
        onToggle={vi.fn()}
      />,
    )

    const button = screen.getByRole('button', { name: 'Preço: crescente, prioridade 2' })
    expect(button).toHaveAttribute('aria-label', 'Preço: crescente, prioridade 2')
  })

  it('shows "sem ordenação" in the aria-label when there is no active criterion', () => {
    render(<SortableHeader label="Preço" onToggle={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Preço: sem ordenação' })
    expect(button).toHaveAttribute('aria-label', 'Preço: sem ordenação')
    expect(button).toHaveTextContent('Preço')
  })

  it('renders the direction arrow and priority next to the label when there is an active criterion', () => {
    render(
      <SortableHeader
        label="Preço"
        criterion={{ key: 'preco', direction: 'desc' }}
        priority={3}
        onToggle={vi.fn()}
      />,
    )

    expect(screen.getByRole('button')).toHaveTextContent('Preço ↓ 3')
  })

  it('does not render an arrow or priority when there is no active criterion', () => {
    render(<SortableHeader label="Preço" onToggle={vi.fn()} />)

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Preço')
    expect(button.textContent).toBe('Preço')
  })

  it('calls onToggle when the button is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<SortableHeader label="Preço" onToggle={onToggle} />)

    await user.click(screen.getByRole('button'))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
