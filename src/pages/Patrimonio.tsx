import { useEffect, useState } from 'react'
import { buscarCurvaValorizacao, type PontoCurvaValorizacao } from '../api/mpv'
import type { Atleta } from '../api/atletas'
import AtletaAutocomplete from '../components/AtletaAutocomplete'
import CurvaTransicao from '../components/CurvaTransicao'
import SimuladorValorizacao from '../components/SimuladorValorizacao'

export default function Patrimonio() {
  const [curva, setCurva] = useState<PontoCurvaValorizacao[] | null>(null)
  const [erroCurva, setErroCurva] = useState<string | null>(null)
  const [atletaSelecionado, setAtletaSelecionado] = useState<Atleta | null>(null)

  useEffect(() => {
    let ativo = true
    buscarCurvaValorizacao()
      .then((dados) => {
        if (ativo) setCurva(dados)
      })
      .catch((err: Error) => {
        if (ativo) setErroCurva(err.message)
      })
    return () => {
      ativo = false
    }
  }, [])

  return (
    <main>
      <header>
        <h2>Patrimônio</h2>
        <p>
          Planeje valorização com estimativas históricas e preserve poder de compra ao longo do
          campeonato.
        </p>
      </header>

      <section aria-labelledby="simulacao-avulsa-titulo">
        <h3 id="simulacao-avulsa-titulo">Simulação avulsa</h3>
        <p>Escolha um atleta para projetar a variação de preço da próxima rodada.</p>
        <AtletaAutocomplete onSelecionar={setAtletaSelecionado} />
        {atletaSelecionado && <SimuladorValorizacao atletaId={atletaSelecionado.id} />}
      </section>

      <section aria-labelledby="curva-titulo">
        <h3 id="curva-titulo">Curva de transição estratégica</h3>
        {!curva && !erroCurva && <p role="status">Carregando curva de valorização…</p>}
        {erroCurva && <p role="alert">{erroCurva}</p>}
        {curva && <CurvaTransicao pontos={curva} />}
      </section>
    </main>
  )
}
