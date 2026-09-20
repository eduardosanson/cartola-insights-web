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
import { buscarPerfilRiscoAtleta, type PerfilRisco } from '../api/perfilRisco'
import { buscarMpvAtleta, type MpvAtleta } from '../api/mpv'
import { formatCurrency, formatNumber } from '../utils/formatNumber'
import MandoRodada from '../components/MandoRodada'
import PentagonoQualidade from '../components/PentagonoQualidade'
import RaioXConfronto from '../components/RaioXConfronto'
import SeloRisco from '../components/SeloRisco'
import SplitBars from '../components/SplitBars'
import StatusBadge from '../components/StatusBadge'
import ModalCompararJogador from '../components/ModalCompararJogador'

export default function DetalheJogador() {
  const { id } = useParams<{ id: string }>()

  return <DetalheJogadorConteudo key={id} id={id} />
}

function DetalheJogadorConteudo({ id }: { id: string | undefined }) {
  const [atleta, setAtleta] = useState<Atleta | null>(null)
  const [historico, setHistorico] = useState<PartidaHistorico[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [percentis, setPercentis] = useState<PercentisAtleta | null>(null)
  const [erroPercentis, setErroPercentis] = useState<string | null>(null)
  const [raioX, setRaioX] = useState<RaioXConfrontoTipo | null>(null)
  const [erroRaioX, setErroRaioX] = useState<string | null>(null)
  const [perfilRisco, setPerfilRisco] = useState<PerfilRisco | null>(null)
  const [erroPerfilRisco, setErroPerfilRisco] = useState<string | null>(null)
  const [mpv, setMpv] = useState<MpvAtleta | null>(null)
  const [erroMpv, setErroMpv] = useState<string | null>(null)
  const [modalCompararAberto, setModalCompararAberto] = useState(false)

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

  useEffect(() => {
    if (!id) return
    buscarPerfilRiscoAtleta(Number(id))
      .then(setPerfilRisco)
      .catch((err: Error) => setErroPerfilRisco(err.message))
  }, [id])

  useEffect(() => {
    if (!id) return
    let ativo = true
    buscarMpvAtleta(Number(id))
      .then((dados) => {
        if (ativo) setMpv(dados)
      })
      .catch((err: Error) => {
        if (ativo) setErroMpv(err.message)
      })
    return () => {
      ativo = false
    }
  }, [id])

  const mpvInsuficiente =
    (mpv !== null && (!mpv.confiavel || mpv.mpv_estimado === null)) ||
    (erroMpv !== null && /insuficiente|sem preço|faixas de preço/i.test(erroMpv))

  return (
    <div>
      <Link to="/jogadores">← Jogadores</Link>

      <div className="detalhe-topo">
        {atleta && (
          <header>
            <h2>{atleta.nome}</h2>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>
                {atleta.clube_nome} · {atleta.posicao}
              </span>
              <StatusBadge statusNome={atleta.status_nome} statusId={atleta.status_id} />
            </p>
            <p>
              <button
                type="button"
                className="btn-acao-comparar"
                onClick={() => setModalCompararAberto(true)}
              >
                ⚖️ Comparar jogador
              </button>
            </p>
            <p>
              <MandoRodada
                mando={atleta.mando_rodada}
                rodada={atleta.rodada_atual}
                showRound
              />
            </p>
            {perfilRisco && (
              <p>
                <SeloRisco perfil={perfilRisco} />
              </p>
            )}
            {erroPerfilRisco && <p>{erroPerfilRisco}</p>}
            <p className="numeric">
              Média geral <span>{formatNumber(atleta.media_geral)}</span>
            </p>
            <p className="numeric">
              Média básica <span>{formatNumber(atleta.media_basica)}</span>
            </p>
            <div className="mpv-estimado">
              <strong className="text-label">MPV estimado</strong>
              {mpv?.confiavel && mpv.mpv_estimado !== null && (
                <p>
                  <span className="numeric text-value">{formatCurrency(mpv.mpv_estimado)}</span>{' '}
                  <small className="text-aux">estimativa baseada em dados históricos</small>
                </p>
              )}
              {mpvInsuficiente && <p>Dados insuficientes ainda para estimar.</p>}
              {erroMpv && !mpvInsuficiente && <p>{erroMpv}</p>}
            </div>
            <SplitBars mediaCasa={atleta.media_casa} mediaFora={atleta.media_fora} />
          </header>
        )}

        {erro && <p role="alert">{erro}</p>}
        {!erro && (!atleta || !historico) && <p role="status">Carregando jogador…</p>}

        {percentis && <PentagonoQualidade percentis={percentis} />}
        {erroPercentis && <p>{erroPercentis}</p>}
      </div>

      {atleta && (
        <ModalCompararJogador
          atletaOrigem={atleta}
          aberto={modalCompararAberto}
          onFechar={() => setModalCompararAberto(false)}
        />
      )}

      {raioX && <RaioXConfronto raioX={raioX} />}
      {erroRaioX && <p>{erroRaioX}</p>}

      {!erro && historico && historico.length === 0 && <p role="status">Sem histórico disponível.</p>}

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
