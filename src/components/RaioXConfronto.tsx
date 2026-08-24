import type { RaioXConfronto as RaioXConfrontoTipo, Veredito } from '../api/raioX'
import { formatNumber } from '../utils/formatNumber'

const ROTULOS_VEREDITO: Record<Veredito, string> = {
  referencia_do_time: 'Referência do time',
  contribuicao_dividida: 'Contribuição dividida',
  pontuacao_diluida: 'Pontuação diluída',
}

interface Props {
  raioX: RaioXConfrontoTipo
}

export default function RaioXConfronto({ raioX }: Props) {
  const rotuloMedia = raioX.mando === 'casa' ? 'Média em casa' : 'Média fora'

  return (
    <section>
      <h3>Raio-X do confronto</h3>
      <dl>
        <dt>{rotuloMedia}</dt>
        <dd>{formatNumber(raioX.media_no_mando)}</dd>

        <dt>{raioX.clube_adversario_nome} cede em média</dt>
        <dd>
          {raioX.pontos_cedidos_adversario === null
            ? 'sem dado suficiente'
            : formatNumber(raioX.pontos_cedidos_adversario)}
        </dd>

        <dt>Participação na pontuação do time</dt>
        <dd>
          {raioX.participacao_pontuacao_time_media === null
            ? 'sem dado suficiente'
            : `${formatNumber(raioX.participacao_pontuacao_time_media)}%`}
        </dd>
      </dl>
      <p>
        {raioX.veredito === null
          ? 'Sem veredito ainda (dados insuficientes)'
          : ROTULOS_VEREDITO[raioX.veredito]}
      </p>
    </section>
  )
}
