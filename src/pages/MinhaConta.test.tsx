import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MinhaConta from './MinhaConta'
import * as contasApi from '../api/contas'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../api/contas')
vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

function mockUsuarioLogado() {
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({
    usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
    carregando: false,
    refetch: vi.fn(),
    logout: vi.fn(),
  })
}

describe('MinhaConta', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o email do usuário e a lista de tokens', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([
      { id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null },
    ])

    render(<MinhaConta />)

    expect(screen.getByText(/a@b.com/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())
  })

  it('mostra estado vazio quando não há tokens', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])

    render(<MinhaConta />)

    await waitFor(() =>
      expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument(),
    )
  })

  it('gera um token e mostra o valor cru uma vez', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])
    vi.mocked(contasApi.gerarToken).mockResolvedValue({
      id: 2,
      token: 'valor-cru-do-token',
    })
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /gerar token/i }))

    expect(await screen.findByText('valor-cru-do-token')).toBeInTheDocument()
  })

  it('revoga um token e atualiza a lista', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens)
      .mockResolvedValueOnce([{ id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null }])
      .mockResolvedValueOnce([
        { id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: '2026-08-23T01:00:00Z' },
      ])
    vi.mocked(contasApi.revogarToken).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /revogar/i }))

    expect(contasApi.revogarToken).toHaveBeenCalledWith(1)
    await waitFor(() => expect(screen.getByText('Revogado')).toBeInTheDocument())
  })

  it('mantém a lista já carregada visível quando uma ação seguinte falha', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens)
      .mockResolvedValueOnce([{ id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null }])
      .mockRejectedValueOnce(new Error('falha ao atualizar lista'))
    vi.mocked(contasApi.revogarToken).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /revogar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('falha ao atualizar lista')
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('desabilita o botão "Gerar token" enquanto a chamada está em andamento', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])
    let resolverGeracao!: (valor: { id: number; token: string }) => void
    vi.mocked(contasApi.gerarToken).mockReturnValue(
      new Promise((resolve) => {
        resolverGeracao = resolve
      }),
    )
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument())

    const botao = screen.getByRole('button', { name: /gerar token/i })
    await user.click(botao)

    expect(screen.getByRole('button', { name: /gerando/i })).toBeDisabled()

    resolverGeracao({ id: 3, token: 'outro-token' })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^gerar token$/i })).not.toBeDisabled(),
    )
  })
})
