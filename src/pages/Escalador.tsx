import { type FormEvent, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
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
import { buscarRaioXConfronto } from '../api/raioX'
import CampoTatico, { type DetalhesAtletaCampo } from '../components/CampoTatico'
import { formatCurrency, formatNumber } from '../utils/formatNumber'

const MODOS: Record<ModoOtimizacao, { nome: string; descricao: string }> = {
  classica: { nome: 'Liga Clássica', descricao: 'Prioriza atletas com maior piso de pontuação.' },
  tiro_curto: { nome: 'Tiro Curto', descricao: 'Prioriza atletas com maior teto estimado.' },
  patrimonio: {
    nome: 'Patrimônio',
    descricao: 'Prioriza atletas com maior margem histórica de valorização.',
  },
  overall: {
    nome: 'Overall equilibrado',
    descricao: 'Combina overall, chance de pontuar, confronto e piso básico.',
  },
}

interface ResultadoCompleto {
  escalacao: EscalacaoOtima
  detalhes: Record<number, DetalhesAtletaCampo>
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
  const [aguardandoRetry, setAguardandoRetry] = useState(false)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  async function executarEscalacao() {
    const escalacao = await montarEscalacao({ orcamento, esquema, modo })
    const idsTitulares = escalacao.titulares.map((atleta) => atleta.atleta_id)
    const ids = [...idsTitulares, escalacao.tecnico.atleta_id]
    const [atletas, confrontos] = await Promise.all([
      Promise.allSettled(ids.map((id) => buscarAtleta(id))),
      Promise.allSettled(idsTitulares.map((id) => buscarRaioXConfronto(id))),
    ])
    const detalhes: Record<number, DetalhesAtletaCampo> = {}
    atletas.forEach((resposta, indice) => {
      if (resposta.status === 'fulfilled') {
        detalhes[ids[indice]] = {
          nome: resposta.value.nome,
          clubeNome: resposta.value.clube_nome,
        }
      }
    })
    confrontos.forEach((resposta, indice) => {
      if (resposta.status === 'fulfilled') {
        const atletaId = idsTitulares[indice]
        detalhes[atletaId] = {
          nome: detalhes[atletaId]?.nome ?? `Atleta #${atletaId}`,
          clubeNome: detalhes[atletaId]?.clubeNome,
          adversarioNome: resposta.value.clube_adversario_nome,
          mando: resposta.value.mando,
          mediaNoMando: resposta.value.media_no_mando,
        }
      }
    })
    return { escalacao, detalhes, orcamento }
  }

  async function executarOtimizacao() {
    setCarregando(true)
    setErro(null)
    setResultado(null)

    try {
      const resultado = await executarEscalacao()
      setResultado(resultado)
      setAguardandoRetry(false)
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null
      const isQuotaError =
        apiError?.status === 429 &&
        apiError.code === 'optimization_quota_exceeded' &&
        apiError.retryAfter &&
        apiError.retryAfter > 0

      if (isQuotaError) {
        setAguardandoRetry(true)
        retryTimerRef.current = setTimeout(() => {
          executarOtimizacao()
        }, apiError!.retryAfter! * 1000)
      } else if (apiError?.status === 429) {
        setErro('Serviço temporariamente indisponível. Tente novamente em instantes.')
      } else {
        setErro(
          err instanceof EscalacaoInviavelError
            ? 'Não há escalação viável. Aumente o orçamento ou escolha outro esquema.'
            : (err as Error).message,
        )
      }
    } finally {
      setCarregando(false)
    }
  }

  async function otimizar(event: FormEvent) {
    event.preventDefault()
    setAguardandoRetry(false)

    // Limpa retry anterior se houver
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)

    await executarOtimizacao()
  }

  function cancelarRetry() {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    setAguardandoRetry(false)
    setErro(null)
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
              disabled={aguardandoRetry}
              required
            />
          </label>
          <label>
            Esquema
            <select
              value={esquema}
              onChange={(event) => setEsquema(event.target.value as EsquemaTatico)}
              disabled={!esquemas || aguardandoRetry}
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
              disabled={aguardandoRetry}
            >
              {Object.entries(MODOS).map(([valor, config]) => (
                <option key={valor} value={valor}>
                  {config.nome}
                </option>
              ))}
            </select>
          </label>
          <p className="modo-descricao">{MODOS[modo].descricao}</p>
          {!aguardandoRetry && (
            <button type="submit" disabled={carregando || !esquemas || orcamento <= 0}>
              {carregando ? 'Calculando…' : 'Montar escalação ótima'}
            </button>
          )}
          {aguardandoRetry && (
            <button type="button" onClick={cancelarRetry}>
              Cancelar
            </button>
          )}
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
        {aguardandoRetry && (
          <p role="status">Preparando sua escalação. Aguarde um instante…</p>
        )}
        {erro && <p role="alert">{erro}</p>}
      </section>

      {resultado && <ResultadoEscalacao resultado={resultado} />}
    </main>
  )
}

function ResultadoEscalacao({ resultado }: { resultado: ResultadoCompleto }) {
  const { escalacao, detalhes, orcamento } = resultado
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
          <dt>Pontuação esperada</dt>
          <dd className="numeric">{formatNumber(escalacao.pontuacao_esperada_total)}</dd>
        </div>
        <div>
          <dt>Estratégia</dt>
          <dd>{MODOS[escalacao.modo].nome}</dd>
        </div>
      </dl>
      <CampoTatico escalacao={escalacao} detalhes={detalhes} />
      <p className="estimativa-nota">
        Os valores são estimativas históricas e não representam promessa de pontuação oficial.
      </p>
    </section>
  )
}
