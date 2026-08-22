import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      { id: 1, nome: 'Flamengo', media_pontos_casa: 55.234, media_pontos_fora: 48.106 },
      { id: 2, nome: 'Vasco', media_pontos_casa: 40.3, media_pontos_fora: 35.7 },
    ])

    render(<Tabela />)

    expect(await screen.findByText('Flamengo')).toBeInTheDocument()
    expect(screen.getByText('55,23')).toBeInTheDocument()
    expect(screen.getByText('48,11')).toBeInTheDocument()
    expect(screen.getByText('Vasco')).toBeInTheDocument()
  })

  it('shows an error message when the API call fails', async () => {
    vi.spyOn(clubesApi, 'listarClubes').mockRejectedValue(new Error('Falha de rede'))

    render(<Tabela />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/falha de rede/i)
  })

  it('ignores a late response after unmount', () => {
    let resolver: ((value: []) => void) | undefined
    vi.spyOn(clubesApi, 'listarClubes').mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve
      }),
    )

    const view = render(<Tabela />)
    view.unmount()
    resolver?.([])

    expect(view.container).toBeEmptyDOMElement()
  })

  it('combines, reverses and removes average sort criteria', async () => {
    vi.spyOn(clubesApi, 'listarClubes').mockResolvedValue([
      { id: 1, nome: 'Flamengo', media_pontos_casa: 55.234, media_pontos_fora: 48.111 },
      { id: 2, nome: 'Vasco', media_pontos_casa: 40.333, media_pontos_fora: 60.555 },
      { id: 3, nome: 'Palmeiras', media_pontos_casa: 55.234, media_pontos_fora: 50.222 },
    ])
    const user = userEvent.setup()
    render(<Tabela />)
    await screen.findByText('Flamengo')

    const casa = screen.getByRole('button', { name: /média casa/i })
    const fora = screen.getByRole('button', { name: /média fora/i })
    await user.click(casa)
    await user.click(fora)

    expect(casa).toHaveTextContent('↓ 1')
    expect(fora).toHaveTextContent('↓ 2')
    expect(within(screen.getAllByRole('row')[1]).getByText('Palmeiras')).toBeInTheDocument()

    await user.click(casa)
    expect(casa).toHaveTextContent('↑ 1')
    expect(within(screen.getAllByRole('row')[1]).getByText('Vasco')).toBeInTheDocument()

    await user.click(casa)
    expect(casa).not.toHaveTextContent(/[↑↓]/)
    expect(fora).toHaveTextContent('↓ 1')
    expect(within(screen.getAllByRole('row')[1]).getByText('Vasco')).toBeInTheDocument()
  })
})
