import type { Posicao } from '../api/atletas'

const POSICOES: Posicao[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']

interface Props {
  selecionadas: Posicao[]
  onToggle: (posicao: Posicao) => void
}

export default function PositionChips({ selecionadas, onToggle }: Props) {
  return (
    <div role="group" aria-label="Filtrar por posição" style={{ display: 'flex', gap: '0.5rem' }}>
      {POSICOES.map((posicao) => {
        const ativo = selecionadas.includes(posicao)
        return (
          <button
            key={posicao}
            type="button"
            aria-pressed={ativo}
            onClick={() => onToggle(posicao)}
            style={{
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: ativo ? 'var(--accent-home)' : 'var(--bg-elevated)',
              color: ativo ? 'white' : 'var(--text)',
              padding: '0.25rem 0.9rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
            }}
          >
            {posicao}
          </button>
        )
      })}
    </div>
  )
}
