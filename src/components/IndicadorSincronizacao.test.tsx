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

  it('does not show the empty-state message while loading', () => {
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockReturnValue(new Promise(() => {}))

    render(<IndicadorSincronizacao />)

    expect(screen.queryByText(/dados ainda não sincronizados/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/atualização indisponível/i)).not.toBeInTheDocument()
  })

  it('shows the user timezone next to the time', async () => {
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue({
      round: 42,
      timestamp: '2026-09-26T15:30:00Z',
    })
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    render(<IndicadorSincronizacao />)

    const el = await screen.findByText(/rodada 42/i)
    expect(el.textContent).toMatch(/[A-Z]{2,5}|GMT|UTC/)
    expect(el.getAttribute('title')).toContain(tz)
  })

  it('falls back to "Atualização indisponível" on an invalid timestamp', async () => {
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue({
      round: 42,
      timestamp: 'nao-e-data',
    })

    render(<IndicadorSincronizacao />)

    expect(await screen.findByText(/atualização indisponível/i)).toBeInTheDocument()
  })

  it('omits the round when the API returns none', async () => {
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue({
      round: null,
      timestamp: '2026-09-26T15:30:00Z',
    })

    render(<IndicadorSincronizacao />)

    const el = await screen.findByText(/sincronizado em/i)
    expect(el.textContent).not.toMatch(/null/)
  })

  it('exposes a status live region', async () => {
    vi.mocked(sincronizacaoApi.fetchSyncStatus).mockResolvedValue(null)

    render(<IndicadorSincronizacao />)

    expect(await screen.findByRole('status')).toHaveTextContent(/dados ainda não sincronizados/i)
  })
})
