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

  // Cache por id de atleta (não por slot A/B) — mantém a distinção
  // entre "quem é A" e "quem é B" fora da chave dos dados, então uma
  // futura troca de rótulos não precisa remodelar o estado. NÃO tenta
  // (ainda) evitar refetch entre execuções do efeito — ver nota abaixo
  // sobre por que essa otimização foi removida.
  const [cache, setCache] = useState<Record<number, DadosAtleta>>({})
  // Guarda de dedupe DENTRO de uma única execução do efeito (só evita
  // 8 chamadas quando idA === idB) — resetada no início de TODA
  // execução, nunca reaproveitada entre execuções. Ver nota no efeito
  // sobre por que ela não pode sobreviver ao cleanup.
  const vistosRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    // As 8 chamadas só disparam quando os dois ids estão presentes e
    // válidos na URL (RF02/brief) — um slot vazio não gera busca parcial.
    if (idA === null || idB === null) return
    let ativo = true
    // Reseta a cada execução do efeito — se esse Set sobrevivesse ao
    // cleanup (ex.: só criado uma vez fora do efeito), o comportamento
    // sob StrictMode quebraria: o React roda efeito→cleanup→efeito de
    // novo no mount; a 2ª execução pularia os ids já "marcados" pela
    // 1ª, e a 1ª teria suas respostas descartadas pelo cleanup (`ativo`
    // vira false) — a tela ficaria presa em "Carregando atleta…" pra
    // sempre. Resetando aqui, a 2ª execução do StrictMode dispara suas
    // próprias 8 chamadas do zero e as conclui normalmente.
    vistosRef.current = new Set()
    for (const id of [idA, idB]) {
      if (vistosRef.current.has(id)) continue
      vistosRef.current.add(id)
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
