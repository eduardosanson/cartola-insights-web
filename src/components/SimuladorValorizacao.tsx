import { useEffect, useState } from 'react'
import { buscarMpvAtleta, type MpvAtleta } from '../api/mpv'
import { formatCurrency } from '../utils/formatNumber'

interface Props {
  atletaId: number
}

export default function SimuladorValorizacao({ atletaId }: Props) {
  const [resultado, setResultado] = useState<{
    atletaId: number
    mpv?: MpvAtleta
    erro?: string
  } | null>(null)
  const [projecao, setProjecao] = useState({ atletaId, pontos: 0 })

  useEffect(() => {
    let ativo = true
    buscarMpvAtleta(atletaId)
      .then((dados) => {
        if (ativo) setResultado({ atletaId, mpv: dados })
      })
      .catch((err: Error) => {
        if (ativo) setResultado({ atletaId, erro: err.message })
      })
    return () => {
      ativo = false
    }
  }, [atletaId])

  const carregando = resultado?.atletaId !== atletaId
  const mpv = carregando ? undefined : resultado.mpv
  const erro = carregando ? undefined : resultado.erro
  const pontos = projecao.atletaId === atletaId ? projecao.pontos : 0

  if (erro) return <p role="alert">{erro}</p>
  if (!mpv) return <p>Carregando estimativa…</p>
  if (!mpv.confiavel || mpv.mpv_estimado === null) {
    return <p>Dados insuficientes ainda para estimar.</p>
  }

  const variacaoEstimada = mpv.coeficientes.a * pontos + mpv.coeficientes.b

  return (
    <section aria-labelledby="simulador-titulo" className="simulador-valorizacao">
      <h3 id="simulador-titulo">Simulador de valorização</h3>
      <label htmlFor={`pontos-projetados-${atletaId}`}>
        Pontuação projetada: <strong>{pontos.toFixed(1)}</strong>
      </label>
      <input
        id={`pontos-projetados-${atletaId}`}
        type="range"
        min="0"
        max="20"
        step="0.1"
        value={pontos}
        onChange={(event) => setProjecao({ atletaId, pontos: Number(event.target.value) })}
      />
      <p>
        Variação estimada: <strong>{formatCurrency(variacaoEstimada)}</strong>
      </p>
      <small>Estimativa baseada em dados históricos; não é a fórmula oficial do Cartola.</small>
    </section>
  )
}
