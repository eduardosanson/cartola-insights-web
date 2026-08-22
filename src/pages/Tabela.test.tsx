import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Tabela from './Tabela'
import * as clubesApi from '../api/clubes'

describe('Tabela', () => {
  it('shows a loading state while fetching', () => {
    vi.spyOn(clubesApi, 'listarClubes').mockReturnValue(new Promise(() => {}))

    render(<Tabela />)

    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('renders clubes with média casa/fora once loaded', async () => {
    vi.spyOn(clubesApi, 'listarClubes').mockResolvedValue([
      { id: 1, nome: 'Flamengo', media_pontos_casa: 55.2, media_pontos_fora: 48.1 },
      { id: 2, nome: 'Vasco', media_pontos_casa: 40.3, media_pontos_fora: 35.7 },
    ])

    render(<Tabela />)

    expect(await screen.findByText('Flamengo')).toBeInTheDocument()
    expect(screen.getByText('55.2')).toBeInTheDocument()
    expect(screen.getByText('48.1')).toBeInTheDocument()
    expect(screen.getByText('Vasco')).toBeInTheDocument()
  })

  it('shows an error message when the API call fails', async () => {
    vi.spyOn(clubesApi, 'listarClubes').mockRejectedValue(new Error('Falha de rede'))

    render(<Tabela />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/falha de rede/i)
  })
})
