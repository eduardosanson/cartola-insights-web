import type { PontoCurvaValorizacao } from '../api/mpv'
import { formatCurrency } from '../utils/formatNumber'

interface Props {
  pontos: PontoCurvaValorizacao[]
}

const LARGURA = 720
const ALTURA = 300
const MARGEM = { topo: 24, direita: 24, baixo: 44, esquerda: 64 }

export default function CurvaTransicao({ pontos }: Props) {
  if (pontos.length === 0) {
    return <p role="status">Nenhum histórico de valorização disponível.</p>
  }

  const rodadas = pontos.map((ponto) => ponto.rodada)
  const valores = pontos.map((ponto) => ponto.variacao_media)
  const minRodada = Math.min(...rodadas)
  const maxRodada = Math.max(...rodadas)
  const minValor = Math.min(...valores, 0)
  const maxValor = Math.max(...valores, 0)
  const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.baixo
  const escalaX = (rodada: number) =>
    MARGEM.esquerda +
    (maxRodada === minRodada ? larguraUtil / 2 : ((rodada - minRodada) / (maxRodada - minRodada)) * larguraUtil)
  const escalaY = (valor: number) =>
    MARGEM.topo +
    (maxValor === minValor ? alturaUtil / 2 : ((maxValor - valor) / (maxValor - minValor)) * alturaUtil)

  const caminho = pontos
    .map((ponto, indice) => `${indice === 0 ? 'M' : 'L'} ${escalaX(ponto.rodada)} ${escalaY(ponto.variacao_media)}`)
    .join(' ')
  const inicioDestaque = escalaX(Math.max(1, minRodada))
  const fimDestaque = escalaX(Math.min(5, maxRodada))
  const temRodadasIniciais = maxRodada >= 1 && minRodada <= 5

  return (
    <figure className="curva-transicao">
      <div className="diagram-wrap">
        <svg
          viewBox={`0 0 ${LARGURA} ${ALTURA}`}
          role="img"
          aria-label="Curva histórica de valorização média por rodada"
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          {temRodadasIniciais && (
            <rect
              data-testid="faixa-rodadas-iniciais"
              data-rodada-inicio="1"
              data-rodada-fim="5"
              x={Math.min(inicioDestaque, fimDestaque)}
              y={MARGEM.topo}
              width={Math.max(Math.abs(fimDestaque - inicioDestaque), 10)}
              height={alturaUtil}
              className="curva-faixa-inicial"
            />
          )}
          <line
            x1={MARGEM.esquerda}
            x2={LARGURA - MARGEM.direita}
            y1={escalaY(0)}
            y2={escalaY(0)}
            className="curva-eixo"
          />
          <path d={caminho} className="curva-linha" fill="none" />
          {pontos.map((ponto) => (
            <g key={ponto.rodada}>
              <circle cx={escalaX(ponto.rodada)} cy={escalaY(ponto.variacao_media)} r="5" />
              <text x={escalaX(ponto.rodada)} y={ALTURA - 16} textAnchor="middle">
                R{ponto.rodada}
              </text>
              <title>{`Rodada ${ponto.rodada}: ${formatCurrency(ponto.variacao_media)}`}</title>
            </g>
          ))}
        </svg>
      </div>
      <figcaption>
        Rodadas 1 a 5 em destaque: priorizar valorização nesse início amplia o poder de compra
        para o restante do campeonato.
      </figcaption>
    </figure>
  )
}
