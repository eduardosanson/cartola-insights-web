import type { StatusAtletaNome } from '../api/atletas'

interface Props {
  statusNome?: StatusAtletaNome | null
  statusId?: number | null
  className?: string
  iconeApenas?: boolean
}

const MAPA_STATUS_ID: Record<number, StatusAtletaNome> = {
  7: 'provavel',
  2: 'duvida',
  3: 'suspenso',
  5: 'contundido',
  6: 'nulo',
}

const LABELS_STATUS: Record<StatusAtletaNome, string> = {
  provavel: 'Provável',
  duvida: 'Dúvida',
  suspenso: 'Suspenso',
  contundido: 'Contundido',
  nulo: 'Nulo',
}

function renderIcone(status: StatusAtletaNome) {
  switch (status) {
    case 'provavel':
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    case 'duvida':
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
        </svg>
      )
    case 'suspenso':
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      )
    case 'contundido':
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
    case 'nulo':
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
  }
}

export default function StatusBadge({
  statusNome,
  statusId,
  className = '',
  iconeApenas = false,
}: Props) {
  const statusResolvido = statusNome ?? (statusId ? MAPA_STATUS_ID[statusId] : null)

  if (!statusResolvido || !LABELS_STATUS[statusResolvido]) {
    return null
  }

  const label = LABELS_STATUS[statusResolvido]

  if (iconeApenas) {
    return (
      <span
        className={`status-badge status-badge-icon status-${statusResolvido} ${className}`.trim()}
        title={`Status: ${label}`}
        aria-label={label}
      >
        {renderIcone(statusResolvido)}
      </span>
    )
  }

  return (
    <span
      className={`status-badge status-${statusResolvido} ${className}`.trim()}
      title={`Status no mercado: ${label}`}
    >
      {renderIcone(statusResolvido)}
      <span>{label}</span>
    </span>
  )
}
