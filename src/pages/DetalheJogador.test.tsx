import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import DetalheJogador from './DetalheJogador'
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

const partida = {
  rodada: 3,
  clube_adversario_id: 2,
  clube_adversario_nome: 'Vasco',
  mando: 'casa' as const,
  pontos_total: 8.5,
  scouts: { G: 1, FT: 2 },
}

function renderDetalhe(id = '1', state: unknown = { atleta }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/jogadores/${id}`, state }]}>
      <Routes>
        <Route path="/jogadores/:id" element={<DetalheJogador />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DetalheJogador', () => {
  it('renders médias from the atleta passed via navigation state and histórico from the API', async () => {
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockResolvedValue([partida])

    renderDetalhe()

    expect(screen.getByRole('heading', { name: 'Gabigol' })).toBeInTheDocument()
    expect(screen.getByText('6.2')).toBeInTheDocument()
    expect(screen.getByText('7.1')).toBeInTheDocument()
    expect(screen.getByText('5.3')).toBeInTheDocument()

    expect(atletasApi.buscarHistoricoAtleta).toHaveBeenCalledWith(1)
    expect(await screen.findByText('Vasco')).toBeInTheDocument()
    expect(screen.getByText('8.5')).toBeInTheDocument()
    expect(screen.getByText('casa')).toBeInTheDocument()
  })

  it('shows a loading state before the histórico resolves', () => {
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockReturnValue(new Promise(() => {}))

    renderDetalhe()

    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('shows an error message when the histórico fetch fails', async () => {
    vi.spyOn(atletasApi, 'buscarHistoricoAtleta').mockRejectedValue(new Error('Falha de rede'))

    renderDetalhe()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
