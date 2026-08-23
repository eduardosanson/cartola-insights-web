import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RotaProtegida from './RotaProtegida'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

function renderComRota(rotaInicial: string) {
  render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <Routes>
        <Route path="/entrar" element={<p>tela de login</p>} />
        <Route
          path="/conta"
          element={
            <RotaProtegida>
              <p>conteúdo protegido</p>
            </RotaProtegida>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RotaProtegida', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra carregando enquanto a sessão ainda não resolveu', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: true,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    renderComRota('/conta')
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('redireciona para /entrar quando não há usuário', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    renderComRota('/conta')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })

  it('renderiza o conteúdo protegido quando há usuário', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    renderComRota('/conta')
    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument()
  })
})
