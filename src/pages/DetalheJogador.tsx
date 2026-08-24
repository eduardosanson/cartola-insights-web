import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  buscarAtleta,
  buscarHistoricoAtleta,
  type Atleta,
  type PartidaHistorico,
} from '../api/atletas'
import { buscarPercentisAtleta, type PercentisAtleta } from '../api/percentis'
import { buscarRaioXConfronto, type RaioXConfronto as RaioXConfrontoTipo } from '../api/raioX'
import { formatNumber } from '../utils/formatNumber'
import MandoRodada from '../components/MandoRodada'
import RadarAtributos from '../components/RadarAtributos'
import RaioXConfronto from '../components/RaioXConfronto'

export default function DetalheJogador() {
  const { id } = useParams<{ id: string }>()
  const [atleta, setAtleta] = useState<Atleta | null>(null)
  const [historico, setHistorico] = useState<PartidaHistorico[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [percentis, setPercentis] = useState<PercentisAtleta | null>(null)
  const [erroPercentis, setErroPercentis] = useState<string | null>(null)
  const [raioX, setRaioX] = useState<RaioXConfrontoTipo | null>(null)
  const [erroRaioX, setErroRaioX] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let ativo = true
    Promise.all([buscarAtleta(Number(id)), buscarHistoricoAtleta(Number(id))])
      .then(([dadosAtleta, dadosHistorico]) => {
        if (ativo) {
          setAtleta(dadosAtleta)
          setHistorico(dadosHistorico)
        }
      })
      .catch((err: Error) => {
        if (ativo) setErro(err.message)
      })
    return () => {
      ativo = false
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    buscarPercentisAtleta(Number(id))
      .then(setPercentis)
      .catch((err: Error) => setErroPercentis(err.message))
  }, [id])

  useEffect(() => {
    if (!id) return
    buscarRaioXConfronto(Number(id))
      .then(setRaioX)
      .catch((err: Error) => setErroRaioX(err.message))
  }, [id])

  return (
    <div>
      <Link to="/jogadores">← Jogadores</Link>

      {atleta && (
        <header>
          <h2>{atleta.nome}</h2>
          <p>
            {atleta.clube_nome} · {atleta.posicao}
          </p>
          <p>
            <MandoRodada
              mando={atleta.mando_rodada}
              rodada={atleta.rodada_atual}
              showRound
            />
          </p>
          <dl className="numeric">
            <dt>Média geral</dt>
            <dd>{formatNumber(atleta.media_geral)}</dd>
            <dt>Média casa</dt>
            <dd style={{ color: 'var(--accent-home)' }}>{formatNumber(atleta.media_casa)}</dd>
            <dt>Média fora</dt>
            <dd style={{ color: 'var(--accent-away)' }}>{formatNumber(atleta.media_fora)}</dd>
          </dl>
        </header>
      )}

      {erro && <p role="alert">{erro}</p>}
      {!erro && (!atleta || !historico) && <p>Carregando jogador…</p>}

      {percentis && <RadarAtributos percentis={percentis} />}
      {erroPercentis && <p>{erroPercentis}</p>}

      {raioX && <RaioXConfronto raioX={raioX} />}
      {erroRaioX && <p>{erroRaioX}</p>}

      {!erro && historico && historico.length === 0 && <p>Sem histórico disponível.</p>}

      {!erro && historico && historico.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Rodada</th>
              <th>Adversário</th>
              <th>Mando</th>
              <th className="numeric">Pontos</th>
              <th>Scouts</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((partida) => (
              <tr key={partida.rodada}>
                <td>{partida.rodada}</td>
                <td>{partida.clube_adversario_nome}</td>
                <td
                  style={{
                    color:
                      partida.mando === 'casa' ? 'var(--accent-home)' : 'var(--accent-away)',
                  }}
                >
                  {partida.mando}
                </td>
                <td className="numeric">{formatNumber(partida.pontos_total)}</td>
                <td>
                  {Object.entries(partida.scouts)
                    .map(([codigo, quantidade]) => `${codigo} ${quantidade}`)
                    .join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
