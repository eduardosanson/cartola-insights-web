import { useState } from 'react'
import { ehPercentisGol, type PercentisAtleta } from '../api/percentis'
import {
  calcularPonto,
  calcularEixos,
  POSICOES_ROTULOS,
  ANEIS,
  EIXOS_LINHAS,
  PONTOS_MEDIANA,
  RAIO_PADRAO,
  CENTRO_X_PADRAO,
  CENTRO_Y_PADRAO,
} from './pentagonoGeometria'

interface Props {
  percentisA: PercentisAtleta
  percentisB: PercentisAtleta
  nomeA: string
  nomeB: string
}

export default function PentagonoDual({ percentisA, percentisB, nomeA, nomeB }: Props) {
  const [ativo, setAtivo] = useState<{ jogador: 'a' | 'b'; indice: number } | null>(null)
  // Posições incompatíveis (GOL vs. linha) não podem sobrepor eixos — o
  // caller decide o fallback (ver RF05/CA03 do spec).
  if (ehPercentisGol(percentisA) !== ehPercentisGol(percentisB)) {
    return null
  }

  const eixosA = calcularEixos(percentisA)
  const eixosB = calcularEixos(percentisB)
  const totalEixos = eixosA.length

  const pontosA = eixosA.map((eixo, i) =>
    calcularPonto(i, totalEixos, eixo.valor, CENTRO_X_PADRAO, CENTRO_Y_PADRAO, RAIO_PADRAO),
  )
  const pontosB = eixosB.map((eixo, i) =>
    calcularPonto(i, totalEixos, eixo.valor, CENTRO_X_PADRAO, CENTRO_Y_PADRAO, RAIO_PADRAO),
  )

  return (
    <figure>
      <div className="diagram-wrap" style={{ position: 'relative' }}>
        <svg
          viewBox="-20 0 380 320"
          role="img"
          aria-label={`Pentágono de Qualidade comparando ${nomeA} e ${nomeB}`}
          style={{ maxWidth: '380px', height: 'auto', display: 'block', margin: '0 auto' }}
        >
          {/* Anéis concêntricos */}
          {ANEIS.map(({ nivel, classe, pontos }) => (
            <polygon key={nivel} data-testid={`anel-${nivel}`} points={pontos} className={classe} />
          ))}

          {/* Eixos radiais */}
          {EIXOS_LINHAS.map((linha, i) => (
            <line
              key={i}
              className="pentagon-axis"
              x1={CENTRO_X_PADRAO}
              y1={CENTRO_Y_PADRAO}
              x2={linha.x2}
              y2={linha.y2}
            />
          ))}

          {/* Sombra da Mediana da posição (50%) */}
          <polygon data-testid="pentagono-mediana" className="pentagon-avg-poly" points={PONTOS_MEDIANA} />

          {/* Polígono do Atleta A */}
          <polygon
            data-testid="pentagono-jogador-a"
            data-atleta="a"
            className="pentagon-player-poly"
            points={pontosA.map((ponto) => ponto.str).join(' ')}
          />

          {/* Polígono do Atleta B */}
          <polygon
            data-testid="pentagono-jogador-b"
            data-atleta="b"
            className="pentagon-player-poly-b"
            points={pontosB.map((ponto) => ponto.str).join(' ')}
          />

          {([['a', pontosA, eixosA, nomeA], ['b', pontosB, eixosB, nomeB]] as const).flatMap(
            ([jogador, pontos, eixos, nome]) =>
              pontos.map((ponto, indice) => (
                <circle
                  key={`${jogador}-${indice}`}
                  data-testid={`vertice-${jogador}-${indice}`}
                  className="pentagon-vertex"
                  style={jogador === 'b' ? { fill: 'var(--accent-away)' } : undefined}
                  cx={ponto.x}
                  cy={ponto.y}
                  r={3.5}
                  tabIndex={0}
                  onMouseEnter={() => setAtivo({ jogador, indice })}
                  onMouseLeave={() => setAtivo(null)}
                  onFocus={() => setAtivo({ jogador, indice })}
                  onBlur={() => setAtivo(null)}
                  aria-label={`${nome}, ${eixos[indice].rotulo}: ${eixos[indice].valor.toFixed(0)}`}
                  aria-describedby={
                    ativo?.jogador === jogador && ativo.indice === indice
                      ? 'pentagono-dual-tooltip'
                      : undefined
                  }
                />
              )),
          )}

          {/* Rótulos dos eixos (comuns aos dois atletas, mesma posição) */}
          {eixosA.map((eixo, i) => (
            <text
              key={eixo.rotulo}
              className="pentagon-label"
              x={POSICOES_ROTULOS[i].x}
              y={POSICOES_ROTULOS[i].y}
              textAnchor={POSICOES_ROTULOS[i].anchor}
            >
              {eixo.rotulo}
            </text>
          ))}
        </svg>
        {ativo && (
          <div id="pentagono-dual-tooltip" role="tooltip" className="pentagono-tooltip">
            <strong>{ativo.jogador === 'a' ? nomeA : nomeB}</strong>
            <div>
              {eixosA[ativo.indice].rotulo}:{' '}
              {(ativo.jogador === 'a' ? eixosA : eixosB)[ativo.indice].valor.toFixed(0)}
            </div>
          </div>
        )}
      </div>

      <figcaption>
        Comparação do <strong>Pentágono de Qualidade</strong> entre{' '}
        <strong>{nomeA}</strong> (verde) e <strong>{nomeB}</strong> (âmbar).
      </figcaption>
    </figure>
  )
}
