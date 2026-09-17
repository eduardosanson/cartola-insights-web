import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import * as contasApi from '../api/contas'

vi.mock('../api/contas')

function Consumidor() {
  const { usuario, carregando, logout } = useAuth()
  if (carregando) return <p>carregando</p>
  return (
    <div>
      <p>{usuario ? usuario.email : 'deslogado'}</p>
      <button onClick={() => logout()}>sair</button>
    </div>
  )
}

function ConsumidorComRefetch() {
  const { usuario, carregando, refetch } = useAuth()
  if (carregando) return <p>carregando</p>
  return (
    <div>
      <p>{usuario ? usuario.email : 'deslogado'}</p>
      <button onClick={() => refetch()}>recarregar</button>
    </div>
  )
}

describe('AuthContext', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('inicia carregando e resolve para o usuário quando a sessão é válida', async () => {
    vi.mocked(contasApi.obterUsuarioAtual).mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      role: 'usuario',
    })

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    )

    expect(screen.getByText('carregando')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument())
  })

  it('resolve para deslogado quando não há sessão válida', async () => {
    vi.mocked(contasApi.obterUsuarioAtual).mockRejectedValue(new Error('401'))

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())
  })

  it('logout chama a API e limpa o usuário', async () => {
    vi.mocked(contasApi.obterUsuarioAtual).mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      role: 'usuario',
    })
    vi.mocked(contasApi.logout).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument())
    await user.click(screen.getByText('sair'))

    expect(contasApi.logout).toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())
  })

  it('useAuth fora do AuthProvider lança erro', () => {
    function ForaDoProvider() {
      useAuth()
      return null
    }
    expect(() => render(<ForaDoProvider />)).toThrow(/AuthProvider/)
  })

  it('refetch limpa o usuário quando uma nova chamada falha', async () => {
    vi.mocked(contasApi.obterUsuarioAtual).mockResolvedValueOnce({
      id: 1,
      email: 'a@b.com',
      role: 'usuario',
    })
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <ConsumidorComRefetch />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('a@b.com')).toBeInTheDocument())

    vi.mocked(contasApi.obterUsuarioAtual).mockRejectedValueOnce(new Error('401'))
    await user.click(screen.getByText('recarregar'))

    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())
  })
})
