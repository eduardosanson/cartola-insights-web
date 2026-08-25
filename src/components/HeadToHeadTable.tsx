import type { PercentisAtleta } from '../api/percentis'
import { calcularEixos } from './pentagonoGeometria'
import { formatNumber } from '../utils/formatNumber'

interface Props {
  percentisA: PercentisAtleta
  percentisB: PercentisAtleta
  nomeA: string
  nomeB: string
}

/**
 * Tabela comparativa Head-to-Head (RF06) — reaproveita `calcularEixos`
 * (mesma fonte de rótulos/valores brutos do Pentágono) em vez de inventar
 * novas métricas. Cada linha marca com badge "Maior" o atleta com o maior
 * valor bruto naquele eixo; quando falta o bruto de um dos dois lados, a
 * linha mostra "—" e nenhum badge é exibido (sem comparação enganosa).
 */
export default function HeadToHeadTable({ percentisA, percentisB, nomeA, nomeB }: Props) {
  const eixosA = calcularEixos(percentisA)
  const eixosB = calcularEixos(percentisB)

  return (
    <section aria-label="Comparação Head-to-Head">
      <h3>Head-to-Head</h3>
      <table>
        <thead>
          <tr>
            <th>Métrica</th>
            <th className="numeric">{nomeA}</th>
            <th className="numeric">{nomeB}</th>
          </tr>
        </thead>
        <tbody>
          {eixosA.map((eixoA, i) => {
            const eixoB = eixosB[i]
            const brutoA = eixoA.bruto
            const brutoB = eixoB.bruto
            const aVence = brutoA !== undefined && brutoB !== undefined && brutoA > brutoB
            const bVence = brutoA !== undefined && brutoB !== undefined && brutoB > brutoA

            return (
              <tr key={eixoA.rotulo}>
                <td>{eixoA.rotulo}</td>
                <td className="numeric">
                  {brutoA !== undefined ? formatNumber(brutoA) : '—'}
                  {aVence && <span className="h2h-badge">Maior</span>}
                </td>
                <td className="numeric">
                  {brutoB !== undefined ? formatNumber(brutoB) : '—'}
                  {bVence && <span className="h2h-badge">Maior</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
