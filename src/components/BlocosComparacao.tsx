import type { Atleta } from '../api/atletas'
import { ehPercentisGol, type PercentisAtleta } from '../api/percentis'
import type { RaioXConfronto as RaioXConfrontoTipo } from '../api/raioX'
import type { PerfilRisco } from '../api/perfilRisco'
import { formatNumber } from '../utils/formatNumber'
import PentagonoDual from './PentagonoDual'
import PentagonoQualidade from './PentagonoQualidade'
import HeadToHeadTable from './HeadToHeadTable'
import RaioXConfronto from './RaioXConfronto'
import SeloRisco from './SeloRisco'

interface DadosAtletaCompletos {
  atleta: Atleta
  percentis: PercentisAtleta
  raioX: RaioXConfrontoTipo
  perfilRisco: PerfilRisco
}

interface Props {
  dadosA: DadosAtletaCompletos
  dadosB: DadosAtletaCompletos
}

/**
 * Os 4 blocos analíticos do comparador (RF05-RF08) — Pentágono Dual (ou
 * fallback CA03), Head-to-Head, Raio-X e Perfil de Risco, os dois
 * últimos lado a lado. O caller (`Comparar.tsx`) só chama este
 * componente quando os dois atletas carregaram por completo — aqui
 * dentro os 4 campos de cada atleta já chegam não-nulos.
 */
export default function BlocosComparacao({ dadosA, dadosB }: Props) {
  // Pentágono e Head-to-Head alinham eixos por índice — só fazem sentido
  // quando os dois atletas são da mesma categoria (GOL ou linha). Raio-X
  // e Perfil de Risco não dependem disso: cada bloco é independente por
  // atleta, só posicionado lado a lado.
  const compativel = ehPercentisGol(dadosA.percentis) === ehPercentisGol(dadosB.percentis)

  return (
    <>
      <section className="comparar-pentagono">
        {compativel ? (
          <PentagonoDual
            percentisA={dadosA.percentis}
            percentisB={dadosB.percentis}
            nomeA={dadosA.atleta.nome}
            nomeB={dadosB.atleta.nome}
          />
        ) : (
          <>
            <p>
              Posições não comparáveis — exibindo os pentágonos de qualidade
              individualmente.
            </p>
            <div className="comparar-duo">
              <PentagonoQualidade percentis={dadosA.percentis} />
              <PentagonoQualidade percentis={dadosB.percentis} />
            </div>
          </>
        )}
      </section>

      {compativel && (
        <HeadToHeadTable
          percentisA={dadosA.percentis}
          percentisB={dadosB.percentis}
          nomeA={dadosA.atleta.nome}
          nomeB={dadosB.atleta.nome}
        />
      )}

      <div className="comparar-duo">
        <RaioXConfronto raioX={dadosA.raioX} />
        <RaioXConfronto raioX={dadosB.raioX} />
      </div>

      <div className="comparar-duo">
        <BlocoPerfilRisco perfil={dadosA.perfilRisco} nome={dadosA.atleta.nome} />
        <BlocoPerfilRisco perfil={dadosB.perfilRisco} nome={dadosB.atleta.nome} />
      </div>
    </>
  )
}

/**
 * Bloco de Perfil de Risco de UM atleta (RF08) — classificação (via
 * `SeloRisco`, já existente) + distribuição retorno-direto/participação.
 * Reaproveita as classes CSS de `.split-bars`/`.bar-track` (mesmo padrão
 * visual do `SplitBars` usado em `DetalheJogador`), mas com rótulos
 * próprios — `SplitBars` tem os rótulos "Média em casa"/"Média fora"
 * fixos no componente, então não cabia reusá-lo aqui sem reescrevê-lo.
 */
function BlocoPerfilRisco({ perfil, nome }: { perfil: PerfilRisco; nome: string }) {
  const total = perfil.pontos_retorno_direto + perfil.pontos_participacao || 1

  return (
    <section>
      <h4>{nome}</h4>
      <p>
        <SeloRisco perfil={perfil} />
      </p>
      <div className="split-bars">
        <div className="split-row">
          <div className="split-row-label">
            <span className="k">Retorno direto</span>
            <span className="v" style={{ color: 'var(--accent-home)' }}>
              {formatNumber(perfil.pontos_retorno_direto)}
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill home"
              style={{ width: `${(perfil.pontos_retorno_direto / total) * 100}%` }}
            />
          </div>
        </div>
        <div className="split-row">
          <div className="split-row-label">
            <span className="k">Participação</span>
            <span className="v" style={{ color: 'var(--accent-away)' }}>
              {formatNumber(perfil.pontos_participacao)}
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill away"
              style={{ width: `${(perfil.pontos_participacao / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
