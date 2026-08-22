import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Jogadores from './Jogadores'
import * as atletasApi from '../api/atletas'

const atleta = {
  id: 1,
  nome: 'Gabigol',
  posicao: 'ATA' as const,
  clube_id: 5,
  clube_nome: 'Flamengo',
  preco_atual: 12.5,
  media_geral: 6.2,
  media_casa: 7.1,
  media_fora: 5.3,
}

function renderJogadores() {
  return render(
    <MemoryRouter>
      <Jogadores />
    </MemoryRouter>,
  )
}

describe('Jogadores', () => {
  beforeEach(() => {
    vi.spyOn(atletasApi, 'listarAtletas').mockResolvedValue([atleta])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the 5 position chips (GOL/ZAG/LAT/MEI/ATA)', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    for (const posicao of ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']) {
      expect(screen.getByRole('button', { name: posicao })).toBeInTheDocument()
    }
  })

  it('renders atletas with clube/posicao/preco/médias once loaded', async () => {
    renderJogadores()

    expect(await screen.findByText('Gabigol')).toBeInTheDocument()
    expect(screen.getByText('Flamengo')).toBeInTheDocument()
    expect(screen.getByText('12.5')).toBeInTheDocument()
  })

  it('shows an error message when the API call fails', async () => {
    vi.spyOn(atletasApi, 'listarAtletas').mockRejectedValue(new Error('Falha de rede'))

    renderJogadores()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('calls the API with the nome filter only after the 300ms debounce', async () => {
    renderJogadores()
    await screen.findByText('Gabigol')

    const input = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(input, { target: { value: 'Gabi' } })

    // still just the initial mount call right after typing, debounce hasn't fired yet
    expect(atletasApi.listarAtletas).not.toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Gabi' }),
    )

    await waitFor(
      () =>
        expect(atletasApi.listarAtletas).toHaveBeenCalledWith(
          expect.objectContaining({ nome: 'Gabi' }),
        ),
      { timeout: 1000 },
    )
  })

  it('filters by position when a chip is clicked', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    renderJogadores()
    await screen.findByText('Gabigol')

    await user.click(screen.getByRole('button', { name: 'ATA' }))

    await waitFor(() =>
      expect(atletasApi.listarAtletas).toHaveBeenCalledWith(
        expect.objectContaining({ posicao: ['ATA'] }),
      ),
    )
  })
})
