import { formatNumber } from '../utils/formatNumber'

interface Props {
  mediaCasa: number
  mediaFora: number
}

export default function SplitBars({ mediaCasa, mediaFora }: Props) {
  const maior = Math.max(mediaCasa, mediaFora, 1)

  return (
    <div className="split-bars">
      <div className="split-row">
        <div className="split-row-label">
          <span className="k">Média em casa</span>
          <span className="v" style={{ color: 'var(--accent-home)' }}>
            {formatNumber(mediaCasa)}
          </span>
        </div>
        <div className="bar-track">
          <div className="bar-fill home" style={{ width: `${(mediaCasa / maior) * 100}%` }} />
        </div>
      </div>
      <div className="split-row">
        <div className="split-row-label">
          <span className="k">Média fora</span>
          <span className="v" style={{ color: 'var(--accent-away)' }}>
            {formatNumber(mediaFora)}
          </span>
        </div>
        <div className="bar-track">
          <div className="bar-fill away" style={{ width: `${(mediaFora / maior) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
