import { useEffect, useState } from 'react'
import { fetchSyncStatus } from '../api/sincronizacao'
import type { SyncStatus } from '../api/sincronizacao'

export default function IndicadorSincronizacao() {
  const [status, setStatus] = useState<SyncStatus | null | 'error'>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchSyncStatus()
        setStatus(result ?? null)
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [])

  if (status === 'error') {
    return <div>Atualização indisponível</div>
  }

  if (status === null) {
    return <div>Dados ainda não sincronizados</div>
  }

  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(status.timestamp))

  return (
    <div title={`UTC: ${status.timestamp}`}>
      Rodada {status.round} • Atualizado em {formatted}
    </div>
  )
}
