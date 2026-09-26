import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import IndicadorSincronizacao from './IndicadorSincronizacao'
import * as sincronizacaoApi from '../api/sincronizacao'

vi.mock('../api/sincronizacao')

describe('IndicadorSincronizacao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays round and formatted timestamp on success', async () => {
    const mockStatus = { round: 42, timestamp: '2026-09-26T15:30:00Z' }
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue(mockStatus)

    render(<IndicadorSincronizacao />)

    const text = await screen.findByText(/rodada 42/i)
    expect(text).toBeInTheDocument()
    expect(screen.getByText(/26.*set.*2026|26.*de.*setembro/i)).toBeInTheDocument()
  })

  it('displays "Dados ainda não sincronizados" when no sync data', async () => {
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue(null)

    render(<IndicadorSincronizacao />)

    const text = await screen.findByText(/dados ainda não sincronizados/i)
    expect(text).toBeInTheDocument()
  })

  it('displays "Atualização indisponível" on API error', async () => {
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockRejectedValue(new Error('Network'))

    render(<IndicadorSincronizacao />)

    const text = await screen.findByText(/atualização indisponível/i)
    expect(text).toBeInTheDocument()
  })

  it('includes UTC timestamp in title attribute for accessibility', async () => {
    const mockStatus = { round: 42, timestamp: '2026-09-26T15:30:00Z' }
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue(mockStatus)

    render(<IndicadorSincronizacao />)

    const container = await screen.findByTitle(/UTC: 2026-09-26T15:30:00Z/i)
    expect(container).toBeInTheDocument()
  })
})
