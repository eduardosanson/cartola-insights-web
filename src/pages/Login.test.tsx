import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Login from './Login'
import * as contasApi from '../api/contas'
import type { Usuario } from '../api/contas'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../api/contas')
vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

function renderLogin(
  initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/entrar'],
) {
  const refetch = vi.fn().mockResolvedValue(undefined)
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({
    usuario: null,
    carregando: false,
    refetch,
    logout: vi.fn(),
  })
  render(
    <MemoryRouter initialEntries={initialEntries}>
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

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('email ou senha inválidos')
    expect(alerta).toHaveStyle({ color: 'var(--danger)' })

    // após o erro, o botão volta a ficar habilitado e com o texto padrão
    // (mata mutantes que removem/invertem o setEnviando(false) do finally)
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('previne o comportamento padrão do submit do formulário', async () => {
    vi.mocked(contasApi.login).mockResolvedValue({ id: 1, email: 'a@b.com', role: 'usuario' })
    renderLogin()
    const form = screen.getByRole('button', { name: /entrar/i }).closest('form')
    expect(form).not.toBeNull()

    const naoPrevenido = fireEvent.submit(form as HTMLFormElement)

    expect(naoPrevenido).toBe(false)
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
  })

  it('limpa mensagem de erro anterior ao iniciar um novo envio', async () => {
    vi.mocked(contasApi.login).mockRejectedValueOnce(new Error('falha anterior'))
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'errada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('falha anterior')

    vi.mocked(contasApi.login).mockImplementation(() => new Promise(() => {}))
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('desabilita o botão e exibe "Entrando…" enquanto a requisição está em andamento', async () => {
    let resolveLogin!: (value: Usuario) => void
    vi.mocked(contasApi.login).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        }),
    )
    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'segredo123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    const botaoEnviando = await screen.findByRole('button', { name: 'Entrando…' })
    expect(botaoEnviando).toBeDisabled()

    resolveLogin({ id: 1, email: 'a@b.com', role: 'usuario' })
    expect(await screen.findByText('tela inicial')).toBeInTheDocument()
  })

  it('exibe mensagem de status quando a navegação chega com mensagem no state', () => {
    renderLogin([{ pathname: '/entrar', state: { mensagem: 'Conta criada com sucesso' } }])
    expect(screen.getByRole('status')).toHaveTextContent('Conta criada com sucesso')
  })

  it('não exibe mensagem de status quando a navegação chega sem mensagem no state', () => {
    renderLogin()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('tem link para a tela de registro', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /criar conta/i })).toHaveAttribute(
      'href',
      '/registrar',
    )
  })
})
