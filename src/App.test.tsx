import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.pushState({}, '', '/')
  })

  it('renders without crashing', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'credencial ausente ou inválida' }),
      }),
    )
    render(<App />)
    const heading = screen.getByText('Cartola Insights')
    expect(heading).toBeInTheDocument()

    const shell = heading.closest('.app-shell') as HTMLElement
    expect(shell).toBeInTheDocument()
    expect(shell.querySelector('header.hud-topo nav')).toBeInTheDocument()
  })

  it('redireciona /conta para a tela de login quando não autenticado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'credencial ausente ou inválida' }),
      }),
    )
    window.history.pushState({}, '', '/conta')

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /entrar/i }),
    ).toBeInTheDocument()
  })
})
