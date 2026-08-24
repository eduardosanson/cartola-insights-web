import type { PerfilRisco } from '../api/perfilRisco'
import { formatNumber } from '../utils/formatNumber'

const presentation = {
  baixo: { label: 'Risco baixo', color: 'var(--accent-home)' },
  medio: { label: 'Risco médio', color: 'var(--accent-away)' },
  alto: { label: 'Risco alto', color: 'var(--danger)' },
}

interface Props {
  perfil: PerfilRisco
}

export default function SeloRisco({ perfil }: Props) {
  const current = presentation[perfil.classificacao]

  return (
    <span style={{ color: current.color }}>
      {current.label} ({formatNumber(perfil.risco_percentual)}%)
    </span>
  )
}
