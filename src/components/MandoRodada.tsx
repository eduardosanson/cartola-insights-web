import type { MandoRodada as Mando } from '../api/atletas'

const presentation = {
  casa: { label: 'Casa', color: 'var(--accent-home)' },
  fora: { label: 'Fora', color: 'var(--accent-away)' },
  sem_jogo: { label: 'Sem jogo', color: 'var(--text-muted)' },
}

interface Props {
  mando: Mando
  rodada: number | null
  showRound?: boolean
}

export default function MandoRodada({ mando, rodada, showRound = false }: Props) {
  const current = presentation[mando]
  let label = current.label
  if (showRound) {
    if (rodada === null) label = 'Sem rodada sincronizada'
    else if (mando === 'sem_jogo') label = `Sem jogo na rodada ${rodada}`
    else label = `Rodada ${rodada} · ${current.label}`
  }

  return <span style={{ color: current.color }}>{label}</span>
}
