import type { RaioXConfronto as RaioXConfrontoTipo, Veredito } from '../api/raioX'
import { formatNumber } from '../utils/formatNumber'

const ROTULOS_VEREDITO: Record<Veredito, string> = {
  referencia_do_time: 'Referência do time',
  contribuicao_dividida: 'Contribuição dividida',
  pontuacao_diluida: 'Pontuação diluída',
}

const TOM_VEREDITO: Record<Veredito, 'positivo' | 'neutro' | 'negativo'> = {
  referencia_do_time: 'positivo',
  contribuicao_dividida: 'neutro',
  pontuacao_diluida: 'negativo',
}

interface Props {
  raioX: RaioXConfrontoTipo
}

export default function RaioXConfronto({ raioX }: Props) {
  const rotuloMedia = raioX.mando === 'casa' ? 'Média em casa' : 'Média fora'

  return (
    <section>
      <h3>Raio-X do confronto</h3>
      <ul className="matchup-cols">
        <li className="matchup-block">
          <p className="mb-label">{rotuloMedia}</p>
          <p className="mb-value" style={{ color: 'var(--accent-home)' }}>
            {formatNumber(raioX.media_no_mando)}
          </p>
        </li>

        <li className="matchup-block">
          <p className="mb-label">{raioX.clube_adversario_nome} cede em média</p>
          <p className="mb-value" style={{ color: 'var(--accent-away)' }}>
            {raioX.pontos_cedidos_adversario === null
              ? 'sem dado suficiente'
              : formatNumber(raioX.pontos_cedidos_adversario)}
          </p>
        </li>

        <li className="matchup-block">
          {raioX.veredito !== null && (
            <span className={`verdict-badge tone-${TOM_VEREDITO[raioX.veredito]}`}>
              {ROTULOS_VEREDITO[raioX.veredito]}
            </span>
          )}
          <p className="mb-value">
            {raioX.participacao_pontuacao_time_media === null
              ? 'sem dado suficiente'
              : `${formatNumber(raioX.participacao_pontuacao_time_media)}%`}
          </p>
          <p className="mb-note">Participação na pontuação do time.</p>
        </li>
      </ul>
      {raioX.veredito === null && <p>Sem veredito ainda (dados insuficientes)</p>}
    </section>
  )
}
