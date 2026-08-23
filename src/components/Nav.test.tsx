import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Nav from './Nav'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

describe('Nav', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra link Entrar quando deslogado', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument()
  })

  it('mostra o email e o botão Sair quando logado', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
      carregando: false,
      refetch: vi.fn(),
      logout,
    })
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'a@b.com' })).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(logout).toHaveBeenCalled()
  })

  it('navega para home mesmo se logout falhar', async () => {
    const logout = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
      carregando: false,
      refetch: vi.fn(),
      logout,
    })
    render(
      <MemoryRouter initialEntries={['/conta']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/conta" element={<Nav />} />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(logout).toHaveBeenCalled()
    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })
})
