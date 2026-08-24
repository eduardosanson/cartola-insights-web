import { useState } from 'react'
import { ehPercentisGol, type PercentisAtleta } from '../api/percentis'
import { formatNumber } from '../utils/formatNumber'

interface Props {
  percentis: PercentisAtleta
  raio?: number
  centroX?: number
  centroY?: number
}

interface Ponto {
  x: number
  y: number
  str: string
}

function calcularPonto(
  indice: number,
  total: number,
  valor: number,
  cx: number,
  cy: number,
  r: number,
): Ponto {
  const angulo = -Math.PI / 2 + indice * ((2 * Math.PI) / total)
  const raioEfetivo = r * (valor / 100)
  const x = cx + raioEfetivo * Math.cos(angulo)
  const y = cy + raioEfetivo * Math.sin(angulo)
  return {
    x,
    y,
    str: `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`,
  }
}

const POSICOES_ROTULOS = [
  { x: 170, y: 36, anchor: 'middle' as const },
  { x: 282, y: 128, anchor: 'start' as const },
  { x: 240, y: 268, anchor: 'middle' as const },
  { x: 98, y: 268, anchor: 'middle' as const },
  { x: 58, y: 128, anchor: 'end' as const },
]

export default function PentagonoQualidade({
  percentis,
  raio = 110,
  centroX = 170,
  centroY = 160,
}: Props) {
  const [ativo, setAtivo] = useState<number | null>(null)

  const isGol = ehPercentisGol(percentis)
  const brutos = percentis.brutos
  const eixos = isGol
    ? [
        { rotulo: 'Pontuação Média', valor: percentis.pontuacao_media ?? 0, bruto: brutos?.pontuacao_media },
        { rotulo: 'Defesas', valor: percentis.defesas ?? 0, bruto: brutos?.indicador2 ?? brutos?.defesas },
        { rotulo: 'Solidez (SG)', valor: percentis.solidez_sg ?? 0, bruto: brutos?.indicador3 ?? brutos?.solidez_sg },
        { rotulo: 'Piso Básico', valor: percentis.media_basica ?? 0, bruto: brutos?.media_basica },
        { rotulo: 'Disciplina', valor: percentis.disciplina ?? 0, bruto: brutos?.disciplina },
      ]
    : [
        { rotulo: 'Poder de Fogo', valor: percentis.pontuacao_media ?? 0, bruto: brutos?.pontuacao_media },
        { rotulo: 'Criação', valor: percentis.participacao_gol ?? 0, bruto: brutos?.indicador2 ?? brutos?.participacao_gol },
        { rotulo: 'Combate', valor: percentis.desarme ?? 0, bruto: brutos?.indicador3 ?? brutos?.desarme },
        { rotulo: 'Piso Básico', valor: percentis.media_basica ?? 0, bruto: brutos?.media_basica },
        { rotulo: 'Disciplina', valor: percentis.disciplina ?? 0, bruto: brutos?.disciplina },
      ]

  const totalEixos = eixos.length

  // Anéis concêntricos regulares (25%, 50%, 75%, 100%)
  const aneis = [
    { nivel: 100, classe: 'pentagon-ring', pontos: '170,50 275,126 235,249 105,249 65,126' },
    { nivel: 75, classe: 'pentagon-ring', pontos: '170,77.5 248.8,134.5 218.8,226.8 121.2,226.8 91.2,134.5' },
    { nivel: 50, classe: 'pentagon-ring-mid', pontos: '170,105 222.5,143 202.5,204.5 137.5,204.5 117.5,143' },
    { nivel: 25, classe: 'pentagon-ring', pontos: '170,132.5 196.25,151.5 186.25,182.25 153.75,182.25 143.75,151.5' },
  ]

  // Eixos radiais (100% de raio)
  const eixosLinhas = [
    { x2: 170, y2: 50 },
    { x2: 275, y2: 126 },
    { x2: 235, y2: 249 },
    { x2: 105, y2: 249 },
    { x2: 65, y2: 126 },
  ]

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
          {aneis.map(({ nivel, classe, pontos }) => (
            <polygon
              key={nivel}
              data-testid={`anel-${nivel}`}
              points={pontos}
              className={classe}
            />
          ))}

          {/* Eixos radiais */}
          {eixosLinhas.map((linha, i) => (
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
            points="170,105 222.5,143 202.5,204.5 137.5,204.5 117.5,143"
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
