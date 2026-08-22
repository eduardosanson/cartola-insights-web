import type { SortCriterion } from '../hooks/useMultiSort'

interface Props<K extends string> {
  label: string
  criterion?: SortCriterion<K>
  priority?: number
  onToggle: () => void
}

export default function SortableHeader<K extends string>({
  label,
  criterion,
  priority,
  onToggle,
}: Props<K>) {
  const directionLabel = criterion?.direction === 'desc' ? 'decrescente' : 'crescente'

  return (
    <th className="numeric">
      <button
        type="button"
        className="sort-button"
        onClick={onToggle}
        aria-label={`${label}: ${criterion ? `${directionLabel}, prioridade ${priority}` : 'sem ordenação'}`}
      >
        {label}
        {criterion && ` ${criterion.direction === 'desc' ? '↓' : '↑'} ${priority}`}
      </button>
    </th>
  )
}
