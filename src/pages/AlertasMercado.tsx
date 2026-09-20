import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarAtleta } from '../api/atletas'
import { buscarStatusAlterados, type StatusAlterado } from '../api/mercado'
import { buscarSubstituto, type SubstitutoSugerido } from '../api/otimizador'
import RaioXConfronto from '../components/RaioXConfronto'
import { formatCurrency, formatNumber } from '../utils/formatNumber'

const ROTULOS_STATUS: Record<number, string> = {
  2: 'Dúvida',
  3: 'Suspenso',
  5: 'Contundido',
  6: 'Nulo',
}

type ResultadoSubstituto =
  | { estado: 'carregando' }
  | { estado: 'erro'; mensagem: string }
  | { estado: 'concluido'; substituto: SubstitutoSugerido | null; nome?: string }

export default function AlertasMercado() {
  const [alteracoes, setAlteracoes] = useState<StatusAlterado[] | null>(null)
  const [nomes, setNomes] = useState<Record<number, string>>({})
  const [erro, setErro] = useState<string | null>(null)
  const [substitutos, setSubstitutos] = useState<Record<number, ResultadoSubstituto>>({})
  const ultimaChecagem = useRef(new Date())

  useEffect(() => {
    let ativo = true

    async function checarStatus() {
      const desde = ultimaChecagem.current
      const checagemIniciadaEm = new Date()
      setErro(null)
      try {
        const dados = await buscarStatusAlterados(desde)
        const atletas = await Promise.allSettled(
          dados.map((alteracao) => buscarAtleta(alteracao.atleta_id)),
        )
        if (!ativo) return
        const nomesCarregados: Record<number, string> = {}
        atletas.forEach((resposta, indice) => {
          if (resposta.status === 'fulfilled') {
            nomesCarregados[dados[indice].atleta_id] = resposta.value.nome
          }
        })
        setNomes(nomesCarregados)
        setAlteracoes(dados)
        if (checagemIniciadaEm > ultimaChecagem.current) {
          ultimaChecagem.current = checagemIniciadaEm
        }
      } catch (err) {
        if (ativo) setErro((err as Error).message)
      }
    }

    function aoMudarVisibilidade() {
      if (document.visibilityState === 'visible') void checarStatus()
    }

    void checarStatus()
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => {
      ativo = false
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    }
  }, [])

  async function carregarSubstituto(atletaId: number) {
    setSubstitutos((atuais) => ({ ...atuais, [atletaId]: { estado: 'carregando' } }))
    try {
      const substituto = await buscarSubstituto(atletaId)
      let nome: string | undefined
      if (substituto) {
        try {
          nome = (await buscarAtleta(substituto.atleta_id)).nome
        } catch {
          nome = undefined
        }
      }
      setSubstitutos((atuais) => ({
        ...atuais,
        [atletaId]: { estado: 'concluido', substituto, nome },
      }))
    } catch (err) {
      setSubstitutos((atuais) => ({
        ...atuais,
        [atletaId]: { estado: 'erro', mensagem: (err as Error).message },
      }))
    }
  }

  return (
    <main>
      <header>
        <h2>Alertas de Mercado</h2>
        <p>Revise mudanças de status antes do fechamento e encontre uma troca elegível.</p>
      </header>
      {!alteracoes && !erro && <p role="status">Verificando mudanças de status…</p>}
      {erro && <p role="alert">{erro}</p>}
      {alteracoes?.length === 0 && <p role="status">Nenhuma mudança de status desde a última checagem.</p>}
      {alteracoes && alteracoes.length > 0 && (
        <ul className="alertas-mercado">
          {alteracoes.map((alteracao) => {
            const resultado = substitutos[alteracao.atleta_id]
            return (
              <li key={alteracao.atleta_id} className="alerta-mercado-card">
                <header>
                  <h3>
                    <Link to={`/jogadores/${alteracao.atleta_id}`}>
                      {nomes[alteracao.atleta_id] ?? `Atleta #${alteracao.atleta_id}`}
                    </Link>
                  </h3>
                  <span className="status-alerta">
                    {ROTULOS_STATUS[alteracao.status_id] ?? `Status ${alteracao.status_id}`}
                  </span>
                </header>
                <button
                  type="button"
                  disabled={resultado?.estado === 'carregando'}
                  onClick={() => void carregarSubstituto(alteracao.atleta_id)}
                >
                  {resultado?.estado === 'carregando'
                    ? 'Buscando substituto…'
                    : 'Ver substituto sugerido'}
                </button>
                {resultado?.estado === 'erro' && <p role="alert">{resultado.mensagem}</p>}
                {resultado?.estado === 'concluido' && resultado.substituto === null && (
                  <p>Nenhum substituto direto encontrado nessa faixa de preço.</p>
                )}
                {resultado?.estado === 'concluido' && resultado.substituto && (
                  <section className="substituto-sugerido" aria-label="Substituto sugerido">
                    <h4>
                      <Link to={`/jogadores/${resultado.substituto.atleta_id}`}>
                        {resultado.nome ?? `Atleta #${resultado.substituto.atleta_id}`}
                      </Link>
                    </h4>
                    <p>
                      {resultado.substituto.posicao} · {formatCurrency(resultado.substituto.preco)} ·
                      score {formatNumber(resultado.substituto.score)}
                    </p>
                    <RaioXConfronto raioX={resultado.substituto.proximo_confronto} />
                  </section>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
