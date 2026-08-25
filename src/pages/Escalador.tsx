import { type FormEvent, useEffect, useState } from 'react'
import { buscarAtleta } from '../api/atletas'
import {
  EscalacaoInviavelError,
  buscarEsquemas,
  montarEscalacao,
  type EscalacaoOtima,
  type EsquemaTatico,
  type EsquemasDisponiveis,
  type ModoOtimizacao,
} from '../api/otimizador'
import CampoTatico from '../components/CampoTatico'
import { formatCurrency, formatNumber } from '../utils/formatNumber'

const MODOS: Record<ModoOtimizacao, { nome: string; descricao: string }> = {
  classica: { nome: 'Liga Clássica', descricao: 'Prioriza atletas com maior piso de pontuação.' },
  tiro_curto: { nome: 'Tiro Curto', descricao: 'Prioriza atletas com maior teto estimado.' },
  patrimonio: {
    nome: 'Patrimônio',
    descricao: 'Prioriza atletas com maior margem histórica de valorização.',
  },
}

interface ResultadoCompleto {
  escalacao: EscalacaoOtima
  nomes: Record<number, string>
  orcamento: number
}

export default function Escalador() {
  const [esquemas, setEsquemas] = useState<EsquemasDisponiveis | null>(null)
  const [orcamento, setOrcamento] = useState(100)
  const [esquema, setEsquema] = useState<EsquemaTatico>('4-3-3')
  const [modo, setModo] = useState<ModoOtimizacao>('classica')
  const [resultado, setResultado] = useState<ResultadoCompleto | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    buscarEsquemas()
      .then((dados) => {
        if (ativo) setEsquemas(dados)
      })
      .catch((err: Error) => {
        if (ativo) setErro(err.message)
      })
    return () => {
      ativo = false
    }
  }, [])

  async function otimizar(event: FormEvent) {
    event.preventDefault()
    setCarregando(true)
    setErro(null)
    setResultado(null)
    try {
      const escalacao = await montarEscalacao({ orcamento, esquema, modo })
      const ids = [...escalacao.titulares.map((atleta) => atleta.atleta_id), escalacao.tecnico.atleta_id]
      const atletas = await Promise.allSettled(ids.map((id) => buscarAtleta(id)))
      const nomes: Record<number, string> = {}
      atletas.forEach((resposta, indice) => {
        if (resposta.status === 'fulfilled') nomes[ids[indice]] = resposta.value.nome
      })
      setResultado({ escalacao, nomes, orcamento })
    } catch (err) {
      setErro(
        err instanceof EscalacaoInviavelError
          ? 'Não há escalação viável. Aumente o orçamento ou escolha outro esquema.'
          : (err as Error).message,
      )
    } finally {
      setCarregando(false)
    }
  }

  const formacao = esquemas?.[esquema]

  return (
    <main>
      <header>
        <h2>Escalador</h2>
        <p>Monte 11 titulares e técnico respeitando orçamento, formação e limite por clube.</p>
      </header>

      <section aria-labelledby="parametros-escalador">
        <h3 id="parametros-escalador">Estratégia</h3>
        <form className="otimizador-form" onSubmit={otimizar}>
          <label>
            Orçamento (C$)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={orcamento}
              onChange={(event) => setOrcamento(Number(event.target.value))}
              required
            />
          </label>
          <label>
            Esquema
            <select
              value={esquema}
              onChange={(event) => setEsquema(event.target.value as EsquemaTatico)}
              disabled={!esquemas}
            >
              {(Object.keys(esquemas ?? { '4-3-3': {} }) as EsquemaTatico[]).map((nome) => (
                <option key={nome}>{nome}</option>
              ))}
            </select>
          </label>
          <label>
            Modo
            <select
              value={modo}
              onChange={(event) => setModo(event.target.value as ModoOtimizacao)}
            >
              {Object.entries(MODOS).map(([valor, config]) => (
                <option key={valor} value={valor}>
                  {config.nome}
                </option>
              ))}
            </select>
          </label>
          <p className="modo-descricao">{MODOS[modo].descricao}</p>
          <button type="submit" disabled={carregando || !esquemas || orcamento <= 0}>
            {carregando ? 'Calculando…' : 'Montar escalação ótima'}
          </button>
        </form>
        {!esquemas && !erro && <p>Carregando esquemas…</p>}
        {formacao && (
          <p className="formacao-resumo">
            Formação: {Object.entries(formacao)
              .filter(([, quantidade]) => quantidade > 0)
              .map(([posicao, quantidade]) => `${quantidade} ${posicao}`)
              .join(' · ')}
          </p>
        )}
        {erro && <p role="alert">{erro}</p>}
      </section>

      {resultado && <ResultadoEscalacao resultado={resultado} />}
    </main>
  )
}

function ResultadoEscalacao({ resultado }: { resultado: ResultadoCompleto }) {
  const { escalacao, nomes, orcamento } = resultado
  const sobra = Math.max(0, orcamento - escalacao.custo_total)

  return (
    <section aria-labelledby="resultado-escalador">
      <h3 id="resultado-escalador">Escalação sugerida</h3>
      <dl className="otimizador-totais">
        <div>
          <dt>Orçamento</dt>
          <dd className="numeric">
            {formatCurrency(escalacao.custo_total)} de {formatCurrency(orcamento)} —{' '}
            {formatCurrency(sobra)} sobrando
          </dd>
        </div>
        <div>
          <dt>Total do objetivo</dt>
          <dd className="numeric">{formatNumber(escalacao.pontuacao_esperada_total)}</dd>
        </div>
        <div>
          <dt>Estratégia</dt>
          <dd>{MODOS[escalacao.modo].nome}</dd>
        </div>
      </dl>
      <CampoTatico escalacao={escalacao} nomes={nomes} />
      <p className="estimativa-nota">
        Os valores são estimativas históricas e não representam promessa de pontuação oficial.
      </p>
    </section>
  )
}
