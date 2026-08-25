import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buscarAtleta, type Atleta } from '../api/atletas'
import { buscarPercentisAtleta, type PercentisAtleta } from '../api/percentis'
import { buscarRaioXConfronto, type RaioXConfronto as RaioXConfrontoTipo } from '../api/raioX'
import { buscarPerfilRiscoAtleta, type PerfilRisco } from '../api/perfilRisco'
import AtletaAutocomplete from '../components/AtletaAutocomplete'

type StatusAtleta = 'carregando' | 'ok' | 'erro-parcial'

interface DadosAtleta {
  status: StatusAtleta
  atleta: Atleta | null
  percentis: PercentisAtleta | null
  raioX: RaioXConfrontoTipo | null
  perfilRisco: PerfilRisco | null
}

/**
 * Lê um id de atleta da query string. `null` quando o parâmetro está
 * ausente ou não é um número válido — tratado como "slot vazio" (RF02).
 */
function lerId(valor: string | null): number | null {
  if (!valor) return null
  const id = Number(valor)
  return Number.isNaN(id) ? null : id
}

export default function Comparar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const idA = lerId(searchParams.get('a'))
  const idB = lerId(searchParams.get('b'))

  // Cache por id de atleta (não por slot A/B) — permite que a futura
  // inversão de atletas (Fase 2, Bloco E) troque `a`/`b` na URL sem
  // refazer as 8 chamadas de rede, já que os dados já buscados
  // continuam disponíveis pelo id.
  const [cache, setCache] = useState<Record<number, DadosAtleta>>({})
  const solicitados = useRef<Set<number>>(new Set())

  useEffect(() => {
    // As 8 chamadas só disparam quando os dois ids estão presentes e
    // válidos na URL (RF02/brief) — um slot vazio não gera busca parcial.
    if (idA === null || idB === null) return
    let ativo = true
    for (const id of [idA, idB]) {
      if (solicitados.current.has(id)) continue
      solicitados.current.add(id)
      setCache((atual) => ({
        ...atual,
        [id]: { status: 'carregando', atleta: null, percentis: null, raioX: null, perfilRisco: null },
      }))
      Promise.allSettled([
        buscarAtleta(id),
        buscarPercentisAtleta(id),
        buscarRaioXConfronto(id),
        buscarPerfilRiscoAtleta(id),
      ]).then(([resAtleta, resPercentis, resRaioX, resPerfilRisco]) => {
        if (!ativo) return
        const status: StatusAtleta =
          resAtleta.status === 'fulfilled' &&
          resPercentis.status === 'fulfilled' &&
          resRaioX.status === 'fulfilled' &&
          resPerfilRisco.status === 'fulfilled'
            ? 'ok'
            : 'erro-parcial'
        setCache((atual) => ({
          ...atual,
          [id]: {
            status,
            atleta: resAtleta.status === 'fulfilled' ? resAtleta.value : null,
            percentis: resPercentis.status === 'fulfilled' ? resPercentis.value : null,
            raioX: resRaioX.status === 'fulfilled' ? resRaioX.value : null,
            perfilRisco: resPerfilRisco.status === 'fulfilled' ? resPerfilRisco.value : null,
          },
        }))
      })
    }
    return () => {
      ativo = false
    }
  }, [idA, idB])

  function selecionar(slot: 'a' | 'b') {
    return (atleta: Atleta) => {
      setSearchParams((atual) => {
        const proximo = new URLSearchParams(atual)
        proximo.set(slot, String(atleta.id))
        return proximo
      })
    }
  }

  if (idA === null || idB === null) {
    return (
      <div className="comparar-selecao">
        <AtletaAutocomplete onSelecionar={selecionar('a')} />
        <AtletaAutocomplete onSelecionar={selecionar('b')} />
      </div>
    )
  }

  const dadosA = cache[idA]
  const dadosB = cache[idB]

  return (
    <div className="comparar-conteudo">
      <BlocoAtleta dados={dadosA} />
      <BlocoAtleta dados={dadosB} />
    </div>
  )
}

/**
 * Placeholder mínimo por atleta: nome quando disponível e "Dados
 * insuficientes" no lugar dos blocos analíticos quando alguma das 4
 * chamadas falhou (RNF04/CA05). Os blocos de fato (Pentágono Dual,
 * head-to-head, raio-X, perfil de risco) são construídos na Fase 2
 * Bloco D, sobre este mesmo estado.
 */
function BlocoAtleta({ dados }: { dados: DadosAtleta | undefined }) {
  if (!dados || dados.status === 'carregando') {
    return <p>Carregando atleta…</p>
  }

  return (
    <div>
      {dados.atleta && <h2>{dados.atleta.nome}</h2>}
      {dados.status === 'erro-parcial' && <p>Dados insuficientes</p>}
    </div>
  )
}
