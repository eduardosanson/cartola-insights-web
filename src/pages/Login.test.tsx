import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Login from './Login'
import * as contasApi from '../api/contas'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../api/contas')
vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

function renderLogin() {
  const refetch = vi.fn().mockResolvedValue(undefined)
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({
    usuario: null,
    carregando: false,
    refetch,
    logout: vi.fn(),
  })
  render(
    <MemoryRouter initialEntries={['/entrar']}>
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/" element={<p>tela inicial</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { refetch }
}

describe('Login', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('envia email e senha, chama refetch e redireciona para / em caso de sucesso', async () => {
    vi.mocked(contasApi.login).mockResolvedValue({ id: 1, email: 'a@b.com', role: 'usuario' })
    const { refetch } = renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'segredo123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(contasApi.login).toHaveBeenCalledWith('a@b.com', 'segredo123')
    expect(refetch).toHaveBeenCalled()
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
  })

  it('mostra mensagem de erro quando o login falha', async () => {
    vi.mocked(contasApi.login).mockRejectedValue(new Error('email ou senha inválidos'))
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'errada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('email ou senha inválidos')
  })

  it('tem link para a tela de registro', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /criar conta/i })).toHaveAttribute(
      'href',
      '/registrar',
    )
  })
})
