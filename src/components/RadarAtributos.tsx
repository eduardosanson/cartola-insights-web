import { ehPercentisGol, type PercentisAtleta } from '../api/percentis'

interface Props {
  percentis: PercentisAtleta
  raio?: number
  centroX?: number
  centroY?: number
}

function pontoEixo(
  indice: number,
  total: number,
  valor: number,
  cx: number,
  cy: number,
  r: number,
) {
  const angulo = -Math.PI / 2 + indice * ((2 * Math.PI) / total)
  const raioEfetivo = r * (valor / 100)
  const x = cx + raioEfetivo * Math.cos(angulo)
  const y = cy + raioEfetivo * Math.sin(angulo)
  // Arredonda pra número inteiro só na formatação do atributo `points` —
  // evita ponto flutuante tipo "150.00000000001" no snapshot/teste.
  return `${Math.round(x)},${Math.round(y)}`
}

export default function RadarAtributos({
  percentis,
  raio = 100,
  centroX = 150,
  centroY = 150,
}: Props) {
  const eixos = ehPercentisGol(percentis)
    ? [
        { rotulo: 'Pontuação média', valor: percentis.pontuacao_media },
        { rotulo: 'Defesas', valor: percentis.defesas },
        { rotulo: 'Solidez (SG)', valor: percentis.solidez_sg },
        { rotulo: 'Disciplina', valor: percentis.disciplina },
      ]
    : [
        { rotulo: 'Pontuação média', valor: percentis.pontuacao_media },
        { rotulo: 'Participação em gol', valor: percentis.participacao_gol },
        { rotulo: 'Desarme', valor: percentis.desarme },
        { rotulo: 'Disciplina', valor: percentis.disciplina },
      ]

  const pontos = eixos
    .map((eixo, indice) =>
      pontoEixo(indice, eixos.length, eixo.valor, centroX, centroY, raio),
    )
    .join(' ')

  const raioAnel = `${centroX - raio},${centroY} ${centroX},${centroY - raio} ${centroX + raio},${centroY} ${centroX},${centroY + raio}`

  return (
    <div>
      <svg
        viewBox={`0 0 ${centroX * 2} ${centroY * 2}`}
        role="img"
        aria-label="Radar de atributos"
      >
        <polygon points={raioAnel} fill="none" stroke="var(--border)" />
        <polygon
          data-testid="radar-poligono"
          points={pontos}
          fill="var(--accent-home)"
          fillOpacity={0.35}
          stroke="var(--accent-home)"
        />
      </svg>
      <dl>
        {eixos.map((eixo) => (
          <div key={eixo.rotulo}>
            <dt>{eixo.rotulo}</dt>
            <dd>{eixo.valor.toFixed(0)}º percentil</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}