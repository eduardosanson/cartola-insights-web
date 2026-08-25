import { useState } from 'react'
import { ehPercentisGol, type PercentisAtleta } from '../api/percentis'
import { formatNumber } from '../utils/formatNumber'
import {
  calcularPonto,
  calcularEixos,
  POSICOES_ROTULOS,
  ANEIS,
  EIXOS_LINHAS,
  PONTOS_MEDIANA,
} from './pentagonoGeometria'

interface Props {
  percentis: PercentisAtleta
  raio?: number
  centroX?: number
  centroY?: number
}

export default function PentagonoQualidade({
  percentis,
  raio = 110,
  centroX = 170,
  centroY = 160,
}: Props) {
  const [ativo, setAtivo] = useState<number | null>(null)

  const isGol = ehPercentisGol(percentis)
  const eixos = calcularEixos(percentis)

  const totalEixos = eixos.length

  // Polígono do jogador
  const pontosJogadorCalculados = eixos.map((eixo, i) =>
    calcularPonto(i, totalEixos, eixo.valor, centroX, centroY, raio),
  )
  const pontosJogadorStr = pontosJogadorCalculados.map((p) => p.str).join(' ')

  // Overall score
  const overallScore =
    percentis.overall_score !== undefined
      ? percentis.overall_score
      : eixos.reduce((acc, e) => acc + e.valor, 0) / totalEixos

  return (
    <figure>
      <div className="diagram-wrap" style={{ position: 'relative' }}>
        <svg
          viewBox="-20 0 380 320"
          role="img"
          aria-label="Pentágono de Qualidade"
          style={{ maxWidth: '380px', height: 'auto', display: 'block', margin: '0 auto' }}
        >
          {/* Anéis concêntricos */}
          {ANEIS.map(({ nivel, classe, pontos }) => (
            <polygon
              key={nivel}
              data-testid={`anel-${nivel}`}
              points={pontos}
              className={classe}
            />
          ))}

          {/* Eixos radiais */}
          {EIXOS_LINHAS.map((linha, i) => (
            <line
              key={i}
              className="pentagon-axis"
              x1={centroX}
              y1={centroY}
              x2={linha.x2}
              y2={linha.y2}
            />
          ))}

          {/* Sombra da Mediana da posição (50%) */}
          <polygon
            data-testid="pentagono-mediana"
            className="pentagon-avg-poly"
            points={PONTOS_MEDIANA}
          />

          {/* Polígono do Atleta */}
          <polygon
            data-testid="pentagono-jogador"
            className="pentagon-player-poly"
            points={pontosJogadorStr}
          />

          {/* Overall Score — número central, dentro do próprio pentágono (CA03) */}
          <text
            data-testid="overall-score"
            className="overall-value"
            textAnchor="middle"
            x={centroX}
            y={centroY}
            dy="0.35em"
          >
            {formatNumber(overallScore)}
          </text>

          {/* Vértices interativos */}
          {pontosJogadorCalculados.map((p, i) => (
            <circle
              key={i}
              data-testid={`vertice-${i}`}
              className="pentagon-vertex"
              cx={p.x}
              cy={p.y}
              r={3.5}
              tabIndex={0}
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
              aria-label={`${eixos[i].rotulo}: ${eixos[i].valor.toFixed(0)}%`}
              aria-describedby={ativo === i ? 'pentagono-tooltip' : undefined}
            />
          ))}

          {/* Rótulos com Percentil Real em volta do Pentágono */}
          {eixos.map((eixo, i) => (
            <text
              key={eixo.rotulo}
              className={`pentagon-label ${eixo.valor >= 75 ? 'hi' : ''}`}
              x={POSICOES_ROTULOS[i].x}
              y={POSICOES_ROTULOS[i].y}
              textAnchor={POSICOES_ROTULOS[i].anchor}
            >
              {eixo.rotulo} {eixo.valor.toFixed(0)}
            </text>
          ))}
        </svg>

        {ativo !== null && (
          <div id="pentagono-tooltip" role="tooltip" className="pentagono-tooltip">
            <strong>{eixos[ativo].rotulo}</strong>
            <div>{eixos[ativo].valor.toFixed(0)}º percentil</div>
            {eixos[ativo].bruto !== undefined && (
              <div>Média: {formatNumber(eixos[ativo].bruto)}</div>
            )}
          </div>
        )}
      </div>

      <figcaption>
        Exemplo de <strong>Pentágono de Qualidade</strong> com 5 eixos para {isGol ? 'goleiros' : 'atacantes'}. A área verde destaca a performance do jogador; a linha tracejada representa a mediana da posição (50º percentil).
      </figcaption>
    </figure>
  )
}
