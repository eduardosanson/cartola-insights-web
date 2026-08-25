import { Link } from 'react-router-dom'
import type { AtletaEscalado, EscalacaoOtima, ModoOtimizacao } from '../api/otimizador'
import { formatCurrency, formatNumber } from '../utils/formatNumber'

const ROTULO_OBJETIVO: Record<ModoOtimizacao, string> = {
  classica: 'Média básica',
  tiro_curto: 'Teto estimado',
  patrimonio: 'Margem sobre MPV',
}

const LINHAS = [
  { nome: 'Ataque', posicoes: ['ATA'] },
  { nome: 'Meio', posicoes: ['MEI'] },
  { nome: 'Defesa', posicoes: ['LAT', 'ZAG'] },
  { nome: 'Gol', posicoes: ['GOL'] },
] as const

interface Props {
  escalacao: EscalacaoOtima
  nomes: Record<number, string>
}

export default function CampoTatico({ escalacao, nomes }: Props) {
  return (
    <div className="campo-tatico" aria-label={`Campo tático ${escalacao.esquema}`}>
      {LINHAS.map((linha) => {
        const atletas = escalacao.titulares.filter((atleta) =>
          linha.posicoes.some((posicao) => posicao === atleta.posicao),
        )
        return (
          <div className="campo-linha" key={linha.nome} aria-label={linha.nome}>
            <span className="campo-linha-rotulo">{linha.nome}</span>
            <div className="campo-atletas">
              {atletas.map((atleta) => (
                <CardAtleta
                  key={atleta.atleta_id}
                  atleta={atleta}
                  nome={nomes[atleta.atleta_id] ?? `Atleta #${atleta.atleta_id}`}
                  modo={escalacao.modo}
                />
              ))}
            </div>
          </div>
        )
      })}
      <div className="campo-linha campo-tecnico" aria-label="Técnico">
        <span className="campo-linha-rotulo">Técnico</span>
        <Link className="campo-atleta" to={`/jogadores/${escalacao.tecnico.atleta_id}`}>
          <strong>{nomes[escalacao.tecnico.atleta_id] ?? `Técnico #${escalacao.tecnico.atleta_id}`}</strong>
          <span>{formatCurrency(escalacao.tecnico.preco)}</span>
        </Link>
      </div>
    </div>
  )
}

function CardAtleta({
  atleta,
  nome,
  modo,
}: {
  atleta: AtletaEscalado
  nome: string
  modo: ModoOtimizacao
}) {
  return (
    <Link className="campo-atleta" to={`/jogadores/${atleta.atleta_id}`}>
      <strong>{nome}</strong>
      <span>{atleta.posicao}</span>
      <span>{formatCurrency(atleta.preco)}</span>
      <span>
        {ROTULO_OBJETIVO[modo]}: {formatNumber(atleta.pontuacao_esperada)}
      </span>
    </Link>
  )
}
