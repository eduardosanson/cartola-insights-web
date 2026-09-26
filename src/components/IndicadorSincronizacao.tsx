import { useEffect, useState } from 'react'
import { fetchSyncStatus } from '../api/sincronizacao'
import type { SyncStatus } from '../api/sincronizacao'

type Estado = 'carregando' | 'erro' | 'vazio' | SyncStatus

function formatar(timestamp: string): string | null {
  const data = new Date(timestamp)
  if (Number.isNaN(data.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'long',
  }).format(data)
}

export default function IndicadorSincronizacao() {
  const [estado, setEstado] = useState<Estado>('carregando')

  useEffect(() => {
    let ativo = true
    fetchSyncStatus()
      .then((result) => ativo && setEstado(result ?? 'vazio'))
      .catch(() => ativo && setEstado('erro'))
    return () => {
      ativo = false
    }
  }, [])

  if (estado === 'carregando') return null

  const formatado = typeof estado === 'object' ? formatar(estado.timestamp) : null

  let texto = 'Atualização indisponível'
  let title: string | undefined
  if (estado === 'vazio') {
    texto = 'Dados ainda não sincronizados'
  } else if (typeof estado === 'object' && formatado) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const rodada = estado.round != null ? `Rodada ${estado.round} • ` : ''
    texto = `${rodada}Sincronizado em ${formatado}`
    title = `UTC: ${estado.timestamp} (fuso local: ${tz})`
  }

  return (
    <div role="status" title={title}>
      {texto}
    </div>
  )
}
