import type { SortCriterion } from '../hooks/useMultiSort'

interface Props<K extends string> {
  label: string
  criterion?: SortCriterion<K>
  priority?: number
  onToggle: () => void
  /** Elemento raiz: `th` dentro de `<table>` (padrão), `div` com
   * role="columnheader" pra cabeçalhos em grid (fora de tabela). */
  as?: 'th' | 'div'
}

export default function SortableHeader<K extends string>({
  label,
  criterion,
  priority,
  onToggle,
  as = 'th',
}: Props<K>) {
  const directionLabel = criterion?.direction === 'desc' ? 'decrescente' : 'crescente'
  const Wrapper = as
  const wrapperProps =
    as === 'div' ? { className: 'numeric', role: 'columnheader' } : { className: 'numeric' }

  return (
    <Wrapper {...wrapperProps}>
      <button
        type="button"
        className="sort-button"
        onClick={onToggle}
        aria-label={`${label}: ${criterion ? `${directionLabel}, prioridade ${priority}` : 'sem ordenação'}`}
      >
        {label}
        {criterion && ` ${criterion.direction === 'desc' ? '↓' : '↑'} ${priority}`}
      </button>
    </Wrapper>
  )
}
