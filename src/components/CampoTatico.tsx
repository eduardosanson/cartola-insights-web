import { Link } from 'react-router-dom'
import type { Mando } from '../api/atletas'
import type { AtletaEscalado, EscalacaoOtima } from '../api/otimizador'
import { formatCurrency, formatNumber } from '../utils/formatNumber'

const LINHAS = [
  { nome: 'Ataque', posicoes: ['ATA'] },
  { nome: 'Meio', posicoes: ['MEI'] },
  { nome: 'Defesa', posicoes: ['LAT', 'ZAG'] },
  { nome: 'Gol', posicoes: ['GOL'] },
] as const

function ordenarDefesa(atletas: AtletaEscalado[]) {
  const laterais = atletas.filter((atleta) => atleta.posicao === 'LAT')
  const zagueiros = atletas.filter((atleta) => atleta.posicao === 'ZAG')

  if (laterais.length < 2) return atletas

  return [laterais[0], ...zagueiros, ...laterais.slice(1)]
}

interface Props {
  escalacao: EscalacaoOtima
  detalhes: Record<number, DetalhesAtletaCampo>
}

export interface DetalhesAtletaCampo {
  nome: string
  clubeNome?: string
  adversarioNome?: string
  mando?: Mando
  mediaNoMando?: number
}

export default function CampoTatico({ escalacao, detalhes }: Props) {
  return (
    <div className="campo-tatico" aria-label={`Campo tático ${escalacao.esquema}`}>
      {LINHAS.map((linha) => {
        const atletasDaLinha = escalacao.titulares.filter((atleta) =>
          linha.posicoes.some((posicao) => posicao === atleta.posicao),
        )
        const atletas = linha.nome === 'Defesa' ? ordenarDefesa(atletasDaLinha) : atletasDaLinha
        return (
          <div className="campo-linha" key={linha.nome} aria-label={linha.nome}>
            <span className="campo-linha-rotulo">{linha.nome}</span>
            <div className="campo-atletas">
              {atletas.map((atleta) => (
                <CardAtleta
                  key={atleta.atleta_id}
                  atleta={atleta}
                  detalhes={detalhes[atleta.atleta_id]}
                />
              ))}
            </div>
          </div>
        )
      })}
      <div className="campo-linha campo-tecnico" aria-label="Técnico">
        <span className="campo-linha-rotulo">Técnico</span>
        <Link className="campo-atleta" to={`/jogadores/${escalacao.tecnico.atleta_id}`}>
          <strong>
            {detalhes[escalacao.tecnico.atleta_id]?.nome ??
              `Técnico #${escalacao.tecnico.atleta_id}`}
          </strong>
          <span className="campo-atleta-clube">
            {detalhes[escalacao.tecnico.atleta_id]?.clubeNome ?? 'Time não disponível'}
          </span>
          <span>TEC · {formatCurrency(escalacao.tecnico.preco)}</span>
        </Link>
      </div>
    </div>
  )
}

function CardAtleta({
  atleta,
  detalhes,
}: {
  atleta: AtletaEscalado
  detalhes?: DetalhesAtletaCampo
}) {
  return (
    <Link className="campo-atleta" to={`/jogadores/${atleta.atleta_id}`}>
      <strong>{detalhes?.nome ?? `Atleta #${atleta.atleta_id}`}</strong>
      <Confronto detalhes={detalhes} />
      <span>
        {atleta.posicao} · {formatCurrency(atleta.preco)}
      </span>
      {detalhes?.mediaNoMando !== undefined && detalhes.mando && (
        <span>
          Média {detalhes.mando}: {formatNumber(detalhes.mediaNoMando)}
        </span>
      )}
    </Link>
  )
}

function Confronto({ detalhes }: { detalhes?: DetalhesAtletaCampo }) {
  if (!detalhes?.clubeNome || !detalhes.adversarioNome || !detalhes.mando) {
    return <span className="campo-atleta-confronto">Confronto não disponível</span>
  }
  const clube = (
    <strong className="campo-atleta-clube">{abreviarClube(detalhes.clubeNome)}</strong>
  )
  const adversario = <span>{abreviarClube(detalhes.adversarioNome)}</span>
  return (
    <span className="campo-atleta-confronto">
      {detalhes.mando === 'casa' ? clube : adversario}
      {' x '}
      {detalhes.mando === 'casa' ? adversario : clube}
    </span>
  )
}

function abreviarClube(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[\s-]+/)[0]
    .slice(0, 3)
    .toUpperCase()
}
