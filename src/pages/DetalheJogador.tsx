import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { buscarHistoricoAtleta, type Atleta, type PartidaHistorico } from '../api/atletas'

interface NavigationState {
  atleta?: Atleta
}

export default function DetalheJogador() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const atleta = (location.state as NavigationState | null)?.atleta

  const [historico, setHistorico] = useState<PartidaHistorico[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let ativo = true
    buscarHistoricoAtleta(Number(id))
      .then((dados) => {
        if (ativo) setHistorico(dados)
      })
      .catch((err: Error) => {
        if (ativo) setErro(err.message)
      })
    return () => {
      ativo = false
    }
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
          <dl className="numeric">
            <dt>Média geral</dt>
            <dd>{atleta.media_geral}</dd>
            <dt>Média casa</dt>
            <dd style={{ color: 'var(--accent-home)' }}>{atleta.media_casa}</dd>
            <dt>Média fora</dt>
            <dd style={{ color: 'var(--accent-away)' }}>{atleta.media_fora}</dd>
          </dl>
        </header>
      )}

      {erro && <p role="alert">{erro}</p>}
      {!erro && !historico && <p>Carregando histórico…</p>}
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
                <td className="numeric">{partida.pontos_total}</td>
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
