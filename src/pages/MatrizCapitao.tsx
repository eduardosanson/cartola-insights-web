import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarAtleta } from '../api/atletas'
import { buscarMatrizCapitao, type CandidatoCapitao } from '../api/otimizador'
import RaioXConfronto from '../components/RaioXConfronto'
import StatusBadge from '../components/StatusBadge'
import { formatNumber, formatPercent } from '../utils/formatNumber'

export default function MatrizCapitao() {
  const [candidatos, setCandidatos] = useState<CandidatoCapitao[] | null>(null)
  const [nomes, setNomes] = useState<Record<number, string>>({})
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    buscarMatrizCapitao()
      .then(async (dados) => {
        const atletas = await Promise.allSettled(
          dados.map((candidato) => buscarAtleta(candidato.atleta_id)),
        )
        if (!ativo) return
        const nomesCarregados: Record<number, string> = {}
        atletas.forEach((resposta, indice) => {
          if (resposta.status === 'fulfilled') {
            nomesCarregados[dados[indice].atleta_id] = resposta.value.nome
          }
        })
        setNomes(nomesCarregados)
        setCandidatos(dados)
      })
      .catch((err: Error) => {
        if (ativo) setErro(err.message)
      })
    return () => {
      ativo = false
    }
  }, [])

  return (
    <main>
      <header>
        <h2>Matriz de Capitão</h2>
        <p>
          Prováveis primeiro; depois dúvidas e nulos por consistência, chance e confronto.
        </p>
      </header>
      {!candidatos && !erro && <p role="status">Calculando candidatos…</p>}
      {erro && <p role="alert">{erro}</p>}
      {candidatos?.length === 0 && <p role="status">Nenhum candidato a capitão disponível.</p>}
      {candidatos && candidatos.length > 0 && (
        <ol className="matriz-capitao">
          {candidatos.map((candidato, indice) => (
            <li className={indice === 0 ? 'capitao-destaque' : undefined} key={candidato.atleta_id}>
              <header className="capitao-cabecalho">
                <div>
                  {indice === 0 && <span className="capitao-selo">1º lugar</span>}
                  <h3>
                    <Link to={`/jogadores/${candidato.atleta_id}`}>
                      {nomes[candidato.atleta_id] ?? `Atleta #${candidato.atleta_id}`}
                    </Link>
                  </h3>
                  <StatusBadge
                    statusId={candidato.status_id}
                    statusNome={candidato.status_nome}
                  />
                </div>
                <strong>{formatNumber(candidato.capitao_score)} pts</strong>
              </header>
              <dl className="capitao-metricas">
                <div>
                  <dt>Média geral</dt>
                  <dd>{formatNumber(candidato.media_geral)}</dd>
                </div>
                <div>
                  <dt>Chance de pontuar</dt>
                  <dd>{formatPercent(candidato.chance_pontuar_percentual)}</dd>
                </div>
                <div>
                  <dt>Fator confronto</dt>
                  <dd>{formatNumber(candidato.fator_confronto)}</dd>
                </div>
              </dl>
              <RaioXConfronto raioX={candidato.proximo_confronto} />
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
